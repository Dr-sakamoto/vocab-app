import { VOCAB_ITEMS, resolveWordId } from "./vocab";
import { VocabItem, WordStat } from "./types";

const ZERO: WordStat = { correct: 0, wrong: 0 };

function toSafeStat(rawCorrect: unknown, rawWrong: unknown): WordStat {
  const correct = Number(rawCorrect);
  const wrong = Number(rawWrong);
  return {
    correct: Number.isFinite(correct) && correct >= 0 ? correct : 0,
    wrong: Number.isFinite(wrong) && wrong >= 0 ? wrong : 0,
  };
}

/**
 * 同じ単語に複数レコードが来たら大きい方を残す。
 *
 * 旧ID `w${i}` のレコードと移行後の安定IDのレコードが併存しうる
 * （複数端末・移行前後の同期）ため、どちらか一方を捨てると進捗が巻き戻る。
 */
function mergeInto(map: Map<string, WordStat>, id: string, stat: WordStat): void {
  const existing = map.get(id);
  map.set(
    id,
    existing
      ? {
          correct: Math.max(existing.correct, stat.correct),
          wrong: Math.max(existing.wrong, stat.wrong),
        }
      : stat,
  );
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
    const stat = toSafeStat(item.correct, item.wrong);

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
    if (saved) return { correct: saved.correct, wrong: saved.wrong };
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

export interface RemoteWordStatRow {
  word_id: string;
  correct: number;
  wrong: number;
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
): WordStat[] {
  const remoteById = new Map<string, WordStat>();
  for (const row of remoteRows ?? []) {
    if (!row || typeof row.word_id !== "string") continue;
    const resolved = resolveWordId(row.word_id);
    if (resolved === null) continue;
    mergeInto(remoteById, resolved, toSafeStat(row.correct, row.wrong));
  }

  return ids.map((id, i) => {
    const local = localStats[i] ?? ZERO;
    const remote = remoteById.get(id) ?? ZERO;
    return {
      correct: Math.max(local.correct, remote.correct),
      wrong: Math.max(local.wrong, remote.wrong),
    };
  });
}
