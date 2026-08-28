import { VOCAB_ITEMS, resolveWordId } from "./vocab";
import { VocabItem, WordStat } from "./types";

const ZERO: WordStat = { correct: 0, wrong: 0 };

/** 分散学習の状態だけを取り出した形。持っていない語では両方とも undefined */
type ReviewState = Pick<WordStat, "lastAnswered" | "correctStreak">;

function toSafeCount(raw: unknown): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * 保存済みの復習スケジュール状態を復元する。
 *
 * localStorage には epoch ミリ秒、Supabase には timestamptz（ISO文字列）で
 * 入っているため両方受ける。解釈できない・そもそも持っていない場合は
 * 空を返し、その語は「時刻を持たない＝従来通りの重み付け」で扱われる。
 */
function toReviewState(rawLastAnswered: unknown, rawCorrectStreak: unknown): ReviewState {
  const lastAnswered =
    typeof rawLastAnswered === "string" ? Date.parse(rawLastAnswered) : Number(rawLastAnswered);
  if (!Number.isFinite(lastAnswered) || lastAnswered <= 0) return {};
  return { lastAnswered, correctStreak: Math.floor(toSafeCount(rawCorrectStreak)) };
}

function toSafeStat(
  rawCorrect: unknown,
  rawWrong: unknown,
  review: ReviewState = {},
): WordStat {
  return { correct: toSafeCount(rawCorrect), wrong: toSafeCount(rawWrong), ...review };
}

/**
 * 同じ単語の2つのレコードを1つに畳む。
 *
 * 正誤の回数は大きい方を残す。旧ID `w${i}` のレコードと移行後の安定IDの
 * レコードが併存しうる（複数端末・移行前後の同期）ため、どちらか一方を
 * 捨てると進捗が巻き戻る。
 *
 * 一方、分散学習の状態（最終解答時刻と連続正解数）は組で1つの意味を持つ
 * ので、項目ごとに max を採ると「端末Aの時刻と端末Bの連続正解数」という
 * 存在しなかった状態が生まれる。時刻の新しい側をまるごと採用する。
 */
export function mergeWordStats(a: WordStat, b: WordStat): WordStat {
  const newer = (b.lastAnswered ?? 0) >= (a.lastAnswered ?? 0) ? b : a;
  return {
    correct: Math.max(a.correct, b.correct),
    wrong: Math.max(a.wrong, b.wrong),
    ...(newer.lastAnswered !== undefined
      ? { lastAnswered: newer.lastAnswered, correctStreak: newer.correctStreak ?? 0 }
      : {}),
  };
}

function mergeInto(map: Map<string, WordStat>, id: string, stat: WordStat): void {
  const existing = map.get(id);
  map.set(id, existing ? mergeWordStats(existing, stat) : stat);
}

/** 前回の同期でアップロードし終えた回数（＝両端末が共有していた基準点） */
export interface SyncBaseEntry {
  correct: number;
  wrong: number;
}
export type SyncBase = Map<string, SyncBaseEntry>;

/**
 * 2端末それぞれで進んだぶんを、基準点からの増分として足し合わせる。
 *
 * 回数を単純に max で畳むと、同じ語を両方の端末で解いた分がまるごと
 * 消える。端末A `(3,1)`・端末B `(2,4)` の合流結果は `(3,4)` で、実際に
 * 解いた `(5,5)` にならない。かといって単純な加算もできない。同期は
 * 「ダウンロード→マージ→アップロード」を毎回まわす全量同期で、ローカルは
 * 前回取り込んだリモートの値をすでに含んでいるため、同じ解答を同期の
 * たびに二重計上してしまう。
 *
 * そこで前回の同期時点の値（base）を端末に控えておき、そこからの増分だけを
 * 足す。base を持たない語（この仕組みより前のデータ、初回同期）は従来どおり
 * max に倒すので、導入した時点で回数が水増しされることはない。
 *
 * 基準点は `min(base, local, remote)` まで下げる。リモートの行が消えた・
 * 古いバックアップから復元したといった理由で値が base を下回った場合でも、
 * 増分が負にならず、進捗が巻き戻らない。
 */
function mergeCount(local: number, remote: number, base: number | undefined): number {
  if (base === undefined) return Math.max(local, remote);
  const anchor = Math.min(base, local, remote);
  return anchor + (local - anchor) + (remote - anchor);
}

/**
 * ローカルとリモートの統計を合流させる。
 *
 * 回数は base からの増分の和（base を持たない語は大きい方）。分散学習の
 * 状態は組で1つの意味を持つので、mergeWordStats と同じく時刻の新しい側を
 * まるごと採る。
 */
export function mergeWordStatsFromBase(
  local: WordStat,
  remote: WordStat,
  base: SyncBaseEntry | undefined,
): WordStat {
  const newer = (remote.lastAnswered ?? 0) >= (local.lastAnswered ?? 0) ? remote : local;
  return {
    correct: mergeCount(local.correct, remote.correct, base?.correct),
    wrong: mergeCount(local.wrong, remote.wrong, base?.wrong),
    ...(newer.lastAnswered !== undefined
      ? { lastAnswered: newer.lastAnswered, correctStreak: newer.correctStreak ?? 0 }
      : {}),
  };
}

/**
 * localStorage に保存された進捗を「安定ID → 統計」の形へ移行する。
 *
 * 受け付ける形式:
 * - `{ id: "severe:adjective", ... }` 現行
 * - `{ id: "w0", ... }`               旧・配列添字直結（凍結スナップショットで解決）
 * - `{ target: "severe", ... }`       id を持たない最古のレコード
 */
export function buildStatsMapFromStoredProgress(
  parsed: unknown,
  items: VocabItem[] = VOCAB_ITEMS,
): Map<string, WordStat> {
  const map = new Map<string, WordStat>();
  if (!Array.isArray(parsed)) return map;

  for (const raw of parsed) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const stat = toSafeStat(
      item.correct,
      item.wrong,
      toReviewState(item.lastAnswered, item.correctStreak),
    );

    if (typeof item.id === "string") {
      const resolved = resolveWordId(item.id);
      if (resolved !== null) {
        mergeInto(map, resolved, stat);
        continue;
      }
    }

    // id を持たない（あるいは解決できない）レコードのみ target で拾う。
    // 品詞違いの同名単語は区別できないため、先頭一致に倒す。
    const matched = items.find((v) => v.target === item.target);
    if (matched) mergeInto(map, matched.id, stat);
  }

  return map;
}

/** 安定IDで引いた統計を現行の出題配列の並びへ戻す */
export function hydrateStats(
  items: VocabItem[],
  statsById: Map<string, WordStat>,
  fallback: WordStat[] = [],
): WordStat[] {
  return items.map((item, i) => {
    const saved = statsById.get(item.id);
    if (saved) return { ...saved };
    const previous = fallback[i];
    return previous ? { ...previous } : { ...ZERO };
  });
}

/** AI承認済み回答のキー（単語ID）を安定IDへ移行する */
export function migrateApprovedAnswers(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const migrated: Record<string, string[]> = {};
  for (const [rawId, answers] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(answers)) continue;
    const resolved = resolveWordId(rawId);
    if (resolved === null) continue;
    const texts = answers.filter((a): a is string => typeof a === "string");
    const existing = migrated[resolved] ?? [];
    migrated[resolved] = [...existing, ...texts.filter((a) => !existing.includes(a))];
  }
  return migrated;
}

/**
 * ローカルとリモートのAI承認済み回答を単語ごとに和集合でマージする。
 *
 * リモート側も migrateApprovedAnswers に通してから合流させるので、
 * 旧IDで残っている行があっても安定IDへ解決してから突き合わせられる。
 */
export function mergeApprovedAnswers(
  local: Record<string, string[]>,
  remote: unknown,
): Record<string, string[]> {
  const migratedRemote = migrateApprovedAnswers(remote);
  const merged: Record<string, string[]> = {};
  for (const [wordId, answers] of Object.entries(local)) {
    merged[wordId] = [...answers];
  }
  for (const [wordId, answers] of Object.entries(migratedRemote)) {
    const existing = merged[wordId] ?? [];
    merged[wordId] = [...existing, ...answers.filter((a) => !existing.includes(a))];
  }
  return merged;
}

/** AI不承認済み回答のキー（単語ID）を安定IDへ移行する */
export function migrateRejectedAnswers(raw: unknown): Record<string, string[]> {
  return migrateApprovedAnswers(raw);
}

/**
 * ローカルとリモートのAI不承認済み回答を単語ごとに和集合でマージする。
 *
 * 承認済み回答と同じ構造（単語ID → 正規化済み文字列の配列）なので、
 * マージロジックもそのまま流用する。
 */
export function mergeRejectedAnswers(
  local: Record<string, string[]>,
  remote: unknown,
): Record<string, string[]> {
  return mergeApprovedAnswers(local, remote);
}

export interface RemoteWordStatRow {
  word_id: string;
  correct: number;
  wrong: number;
  /** 最終解答時刻（timestamptz）。列を追加する前に書かれた行では欠ける */
  last_answered?: string | null;
  correct_streak?: number | null;
}

/**
 * Supabase から取得した行をローカルの統計へマージする。
 *
 * 旧ID `w${i}` の行も安定IDへ解決してから突き合わせるので、語彙を
 * 並べ替えたあとでも既存ユーザーの統計は正しい単語に残る。
 */
export function mergeRemoteWordStats(
  ids: string[],
  localStats: WordStat[],
  remoteRows: RemoteWordStatRow[] | null | undefined,
  base: SyncBase = new Map(),
): WordStat[] {
  const remoteById = new Map<string, WordStat>();
  for (const row of remoteRows ?? []) {
    if (!row || typeof row.word_id !== "string") continue;
    const resolved = resolveWordId(row.word_id);
    if (resolved === null) continue;
    mergeInto(
      remoteById,
      resolved,
      toSafeStat(row.correct, row.wrong, toReviewState(row.last_answered, row.correct_streak)),
    );
  }

  return ids.map((id, i) => {
    const local = localStats[i] ?? ZERO;
    const remote = remoteById.get(id);
    // リモートに行が無い語はローカルをそのまま残す。行の無さは「0回」では
    // なく「まだ載っていない」なので、base からの増分を計算してはいけない。
    return remote ? mergeWordStatsFromBase(local, remote, base.get(id)) : { ...local };
  });
}

/**
 * 同期の基準点を localStorage の保存形から読む。
 *
 * 形は `{ userId, words: { "severe:adjective": [correct, wrong] } }`。
 * ユーザーが変わったら（共用端末での入れ替わり）別人の基準点で増分を
 * 数えないよう、まるごと捨てて「base なし＝max」から数え直す。
 */
export function readSyncBase(raw: unknown, userId: string): SyncBase {
  const base: SyncBase = new Map();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;

  const stored = raw as { userId?: unknown; words?: unknown };
  if (stored.userId !== userId) return base;
  if (!stored.words || typeof stored.words !== "object" || Array.isArray(stored.words)) return base;

  for (const [rawId, pair] of Object.entries(stored.words as Record<string, unknown>)) {
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const resolved = resolveWordId(rawId);
    if (resolved === null) continue;
    base.set(resolved, { correct: toSafeCount(pair[0]), wrong: toSafeCount(pair[1]) });
  }
  return base;
}

/**
 * アップロードし終えた統計を次回の基準点として保存できる形にする。
 *
 * 未挑戦の語（correct/wrong ともに0）は buildWordStatsRows がアップロード
 * から外すのと同じ理由で持たない。base を持たない語は max に倒れるだけで、
 * 0 回どうしの合流は結果が変わらない。
 */
export function buildSyncBase(
  userId: string,
  ids: string[],
  stats: WordStat[],
): { userId: string; words: Record<string, [number, number]> } {
  const words: Record<string, [number, number]> = {};
  ids.forEach((id, i) => {
    const correct = stats[i]?.correct ?? 0;
    const wrong = stats[i]?.wrong ?? 0;
    if (correct === 0 && wrong === 0) return;
    words[id] = [correct, wrong];
  });
  return { userId, words };
}
