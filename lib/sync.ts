import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { QUESTIONS } from "./vocab";
import { WordStat } from "./types";

const VOCAB_IDS = QUESTIONS.map((_, i) => `w${i}`);

export async function signInWithGoogle(): Promise<void> {
  const redirectTo =
    typeof window === "undefined" ? undefined : window.location.origin;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
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
    },
    { onConflict: "user_id" },
  );
  if (metaError) throw metaError;
}

interface DownloadAndMergeProps {
  stats: WordStat[];
  unlockedPoolSize: number;
}

export interface DownloadAndMergeResult {
  stats: WordStat[];
  unlockedPoolSize: number;
}

export async function downloadAndMerge({
  stats,
  unlockedPoolSize,
}: DownloadAndMergeProps): Promise<DownloadAndMergeResult> {
  const user = await requireSignedInUser();

  const { data: remoteWords, error: wordsError } = await supabase
    .from("word_stats")
    .select("word_id, correct, wrong")
    .eq("user_id", user.id);
  if (wordsError) throw wordsError;

  const { data: remoteMeta, error: metaError } = await supabase
    .from("user_meta")
    .select("unlocked_pool_size")
    .eq("user_id", user.id)
    .maybeSingle();
  if (metaError) throw metaError;

  const remoteMap = new Map(remoteWords?.map((row) => [row.word_id, row]) ?? []);
  const mergedStats = VOCAB_IDS.map((id, i) => {
    const local = stats[i] ?? { correct: 0, wrong: 0 };
    const remote = remoteMap.get(id) ?? { correct: 0, wrong: 0 };

    return {
      correct: Math.max(local.correct, remote.correct),
      wrong: Math.max(local.wrong, remote.wrong),
    };
  });

  return {
    stats: mergedStats,
    unlockedPoolSize: Math.max(
      unlockedPoolSize,
      remoteMeta?.unlocked_pool_size ?? 0,
    ),
  };
}
