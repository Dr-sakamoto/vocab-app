import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { VOCAB_IDS } from "./vocab";
import { mergeApprovedAnswers, mergeRejectedAnswers, mergeRemoteWordStats } from "./wordProgress";
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
}

// 未挑戦の単語（correct/wrongともに0）はDB側で行が存在しないのと同義
// （downloadAndMergeが欠損行を {correct:0, wrong:0} として扱う）ため、
// アップロード対象から除外して行数を抑える。
export function buildWordStatsRows(
  userId: string,
  stats: WordStat[],
): { user_id: string; word_id: string; correct: number; wrong: number }[] {
  return VOCAB_IDS.flatMap((id, i) => {
    const correct = stats[i]?.correct ?? 0;
    const wrong = stats[i]?.wrong ?? 0;
    if (correct === 0 && wrong === 0) return [];
    return [{ user_id: userId, word_id: id, correct, wrong }];
  });
}

export async function uploadProgress({
  stats,
  unlockedPoolSize,
  approvedAnswers,
  rejectedAnswers,
}: UploadProgressProps): Promise<void> {
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
    },
    { onConflict: "user_id" },
  );
  if (metaError) throw metaError;
}

interface DownloadAndMergeProps {
  stats: WordStat[];
  unlockedPoolSize: number;
  approvedAnswers: Record<string, string[]>;
  rejectedAnswers: Record<string, string[]>;
}

export interface DownloadAndMergeResult {
  stats: WordStat[];
  unlockedPoolSize: number;
  approvedAnswers: Record<string, string[]>;
  rejectedAnswers: Record<string, string[]>;
}

// PostgRESTは1回のリクエストで最大1000行しか返さないため、
// 挑戦済み語数がそれを超えるユーザーの分を取りこぼさないようページングする。
export const WORD_STATS_PAGE_SIZE = 1000;

type WordStatsRow = { word_id: string; correct: number; wrong: number };
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
      .select("word_id, correct, wrong")
      .eq("user_id", userId)
      .range(from, to),
  );
}

export async function downloadAndMerge({
  stats,
  unlockedPoolSize,
  approvedAnswers,
  rejectedAnswers,
}: DownloadAndMergeProps): Promise<DownloadAndMergeResult> {
  const user = await requireSignedInUser();

  const remoteWords = await fetchAllWordStats(user.id);

  const { data: remoteMeta, error: metaError } = await supabase
    .from("user_meta")
    .select("unlocked_pool_size, approved_answers, rejected_answers")
    .eq("user_id", user.id)
    .maybeSingle();
  if (metaError) throw metaError;

  // 移行前に保存された旧ID `w${i}` の行も安定IDへ解決してから突き合わせる。
  // 旧行は削除しない（解決は凍結スナップショット経由で恒久的に正しく、
  // max マージなので残っていても進捗が巻き戻らない）。
  const mergedStats = mergeRemoteWordStats(VOCAB_IDS, stats, remoteWords);

  return {
    stats: mergedStats,
    unlockedPoolSize: Math.max(
      unlockedPoolSize,
      remoteMeta?.unlocked_pool_size ?? 0,
    ),
    approvedAnswers: mergeApprovedAnswers(
      approvedAnswers,
      remoteMeta?.approved_answers,
    ),
    rejectedAnswers: mergeRejectedAnswers(
      rejectedAnswers,
      remoteMeta?.rejected_answers,
    ),
  };
}
