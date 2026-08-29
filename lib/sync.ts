import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { VOCAB_IDS } from "./vocab";
import {
  buildSyncBase,
  mergeApprovedAnswers,
  mergeRejectedAnswers,
  mergeRemoteWordStats,
  readSyncBase,
  RemoteWordStatRow,
  SyncBase,
} from "./wordProgress";
import { StreakState, mergeStreaks } from "./streak";
import { StoredFlashProgress, mergeStoredFlashProgress } from "./flashWeight";
import { WordStat } from "./types";

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  return session?.user ?? null;
}

async function requireSignedInUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Googleログイン後に同期してください。");
  }
  return user;
}

interface UploadProgressProps {
  stats: WordStat[];
  unlockedPoolSize: number;
  approvedAnswers: Record<string, string[]>;
  rejectedAnswers: Record<string, string[]>;
  dailyStreak: StreakState;
  flashProgress: StoredFlashProgress | null;
}

export interface WordStatsUploadRow {
  user_id: string;
  word_id: string;
  correct: number;
  wrong: number;
  /** 分散学習の最終解答時刻。まだ解答時刻を持たない語は null */
  last_answered: string | null;
  correct_streak: number;
}

// 未挑戦の単語（correct/wrongともに0）はDB側で行が存在しないのと同義
// （downloadAndMergeが欠損行を {correct:0, wrong:0} として扱う）ため、
// アップロード対象から除外して行数を抑える。
export function buildWordStatsRows(
  userId: string,
  stats: WordStat[],
): WordStatsUploadRow[] {
  return VOCAB_IDS.flatMap((id, i) => {
    const stat = stats[i];
    const correct = stat?.correct ?? 0;
    const wrong = stat?.wrong ?? 0;
    if (correct === 0 && wrong === 0) return [];
    const lastAnswered = stat?.lastAnswered;
    return [
      {
        user_id: userId,
        word_id: id,
        correct,
        wrong,
        last_answered:
          typeof lastAnswered === "number" && Number.isFinite(lastAnswered)
            ? new Date(lastAnswered).toISOString()
            : null,
        correct_streak: Math.max(0, Math.floor(stat?.correctStreak ?? 0)),
      },
    ];
  });
}

/**
 * user_meta（解放プール・AI判定キャッシュ）は単語の進捗に付随するデータ。
 * ここが落ちても word_stats の同期は成立させたいので、失敗は投げずに
 * 理由だけ持ち帰り、呼び出し側が「部分的に同期した」と伝えられるようにする。
 *
 * 実際に、rejected_answers 列を本番へ流し忘れていた期間は user_meta の
 * 読み書きが常に失敗し、それが同期全体を巻き込んで単語の進捗まで
 * 一切保存されなくなっていた。
 */
export interface SyncMetaOutcome {
  /** user_meta の読み書きに失敗した理由。成功なら null */
  metaError: string | null;
}

export interface UploadProgressResult extends SyncMetaOutcome {
  /**
   * 次回の同期の基準点。アップロードが通ったときだけ返る（word_stats の
   * 失敗は投げるので、この値が返る＝リモートがこの回数を受け取っている）。
   * 呼び出し側が localStorage へ控え、次回の合流で増分の起点に使う。
   */
  syncBase: { userId: string; words: Record<string, [number, number]> };
}

function describeError(error: { message?: string } | null | undefined): string {
  return error?.message ?? "不明なエラー";
}

export async function uploadProgress({
  stats,
  unlockedPoolSize,
  approvedAnswers,
  rejectedAnswers,
  dailyStreak,
  flashProgress,
}: UploadProgressProps): Promise<UploadProgressResult> {
  const user = await requireSignedInUser();

  const rows = buildWordStatsRows(user.id, stats);

  if (rows.length > 0) {
    const { error: wordsError } = await supabase
      .from("word_stats")
      .upsert(rows, { onConflict: "user_id,word_id" });
    if (wordsError) throw wordsError;
  }

  const { error: metaError } = await supabase.from("user_meta").upsert(
    {
      user_id: user.id,
      unlocked_pool_size: unlockedPoolSize,
      approved_answers: approvedAnswers,
      rejected_answers: rejectedAnswers,
      daily_streak: dailyStreak,
      flash_progress: flashProgress,
    },
    { onConflict: "user_id" },
  );
  if (metaError) console.error("user_meta upload error:", metaError);

  return {
    metaError: metaError ? describeError(metaError) : null,
    syncBase: buildSyncBase(user.id, VOCAB_IDS, stats),
  };
}

interface DownloadAndMergeProps {
  stats: WordStat[];
  /**
   * 前回の同期でアップロードし終えた回数（localStorage の保存形のまま）。
   * ここからの増分だけを足すことで、2端末で並行して解いたぶんが
   * どちらか一方に丸められずに合流する。
   */
  syncBase?: unknown;
  unlockedPoolSize: number;
  approvedAnswers: Record<string, string[]>;
  rejectedAnswers: Record<string, string[]>;
  dailyStreak: StreakState;
  flashProgress: StoredFlashProgress | null;
}

export interface DownloadAndMergeResult extends SyncMetaOutcome {
  stats: WordStat[];
  unlockedPoolSize: number;
  approvedAnswers: Record<string, string[]>;
  rejectedAnswers: Record<string, string[]>;
  dailyStreak: StreakState;
  flashProgress: StoredFlashProgress | null;
}

// PostgRESTは1回のリクエストで最大1000行しか返さないため、
// 挑戦済み語数がそれを超えるユーザーの分を取りこぼさないようページングする。
export const WORD_STATS_PAGE_SIZE = 1000;

type WordStatsRow = RemoteWordStatRow;
type FetchWordStatsPage = (
  from: number,
  to: number,
) => Promise<{ data: WordStatsRow[] | null; error: { message: string } | null }>;

export async function fetchAllPages(
  fetchPage: FetchWordStatsPage,
  pageSize: number = WORD_STATS_PAGE_SIZE,
): Promise<WordStatsRow[]> {
  const rows: WordStatsRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function fetchAllWordStats(userId: string): Promise<WordStatsRow[]> {
  return fetchAllPages(async (from, to) =>
    supabase
      .from("word_stats")
      // user_meta と同じ理由で列名を並べない。列がまだ無い環境では
      // 列挙した select が行ごと取れずにエラーになる（rejected_answers を
      // 流し忘れていた期間に実際に起きた）。word_stats のエラーは
      // user_meta と違って同期全体を止めるので、なおさら列名に縛らない。
      // 欠けている列は mergeRemoteWordStats 側が「未設定」として素通しする。
      .select("*")
      .eq("user_id", userId)
      .range(from, to),
  );
}

/**
 * user_meta の1行から必要な値だけ取り出す。
 *
 * 列名を並べて select すると、列がまだ無い環境では行そのものが取れずに
 * エラーになる。`select("*")` で受けたうえで、欠けているキーは
 * 「未設定」として素通しできるようにここで正規化する。
 */
export function readRemoteMeta(row: unknown): {
  unlockedPoolSize: number;
  approvedAnswers: unknown;
  rejectedAnswers: unknown;
  dailyStreak: unknown;
  flashProgress: unknown;
} {
  const meta = (row ?? {}) as Record<string, unknown>;
  const poolSize = Number(meta.unlocked_pool_size);
  return {
    unlockedPoolSize: Number.isFinite(poolSize) && poolSize > 0 ? poolSize : 0,
    approvedAnswers: meta.approved_answers,
    rejectedAnswers: meta.rejected_answers,
    dailyStreak: meta.daily_streak,
    flashProgress: meta.flash_progress,
  };
}

export async function downloadAndMerge({
  stats,
  unlockedPoolSize,
  approvedAnswers,
  rejectedAnswers,
  dailyStreak,
  flashProgress,
  syncBase,
}: DownloadAndMergeProps): Promise<DownloadAndMergeResult> {
  const user = await requireSignedInUser();

  // 単語の進捗は同期の本体。ここが取れなければ同期は成立しないので投げる。
  const remoteWords = await fetchAllWordStats(user.id);

  const { data: remoteMetaRow, error: metaError } = await supabase
    .from("user_meta")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (metaError) console.error("user_meta download error:", metaError);

  const remoteMeta = readRemoteMeta(remoteMetaRow);

  // 移行前に保存された旧ID `w${i}` の行も安定IDへ解決してから突き合わせる。
  // 旧行は削除しない（解決は凍結スナップショット経由で恒久的に正しく、
  // max マージなので残っていても進捗が巻き戻らない）。
  const base: SyncBase = readSyncBase(syncBase, user.id);
  const mergedStats = mergeRemoteWordStats(VOCAB_IDS, stats, remoteWords, base);

  return {
    stats: mergedStats,
    unlockedPoolSize: Math.max(unlockedPoolSize, remoteMeta.unlockedPoolSize),
    approvedAnswers: mergeApprovedAnswers(approvedAnswers, remoteMeta.approvedAnswers),
    rejectedAnswers: mergeRejectedAnswers(rejectedAnswers, remoteMeta.rejectedAnswers),
    dailyStreak: mergeStreaks(dailyStreak, remoteMeta.dailyStreak),
    flashProgress: mergeStoredFlashProgress(flashProgress, remoteMeta.flashProgress),
    metaError: metaError ? describeError(metaError) : null,
  };
}
