import { supabase } from "./supabase";
import { QUESTIONS } from "./vocab";
import { clampMonsterXP } from "./monster";

const VOCAB_IDS = QUESTIONS.map((_, i) => `w${i}`);

export async function signInWithGoogle() {
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

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  return session?.user ?? null;
}

async function requireSignedInUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Googleログイン後に同期してください。");
  }
  return user;
}

export async function uploadProgress({ stats, unlockedPoolSize, monsterTotalXP }) {
  const user = await requireSignedInUser();

  const rows = VOCAB_IDS.map((id, i) => ({
    user_id: user.id,
    word_id: id,
    correct: stats[i]?.correct ?? 0,
    wrong: stats[i]?.wrong ?? 0,
  }));

  const { error: wordsError } = await supabase
    .from("word_stats")
    .upsert(rows, { onConflict: "user_id,word_id" });
  if (wordsError) throw wordsError;

  const { error: metaError } = await supabase
    .from("user_meta")
    .upsert(
      {
        user_id: user.id,
        unlocked_pool_size: unlockedPoolSize,
        monster_total_xp: clampMonsterXP(monsterTotalXP),
      },
      { onConflict: "user_id" },
    );
  if (metaError) throw metaError;
}

export async function downloadAndMerge({ stats, unlockedPoolSize, monsterTotalXP }) {
  const user = await requireSignedInUser();

  const { data: remoteWords, error: wordsError } = await supabase
    .from("word_stats")
    .select("word_id, correct, wrong")
    .eq("user_id", user.id);
  if (wordsError) throw wordsError;

  const { data: remoteMeta, error: metaError } = await supabase
    .from("user_meta")
    .select("unlocked_pool_size, monster_total_xp")
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
    monsterTotalXP: clampMonsterXP(Math.max(
      monsterTotalXP,
      remoteMeta?.monster_total_xp ?? 0,
    )),
  };
}
