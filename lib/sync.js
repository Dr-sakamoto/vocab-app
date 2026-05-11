import { supabase } from "./supabase";
import { QUESTIONS } from "./vocab";
import { clampMonsterXP, getActiveMonster, normalizeMonsterCollection } from "./monster";

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

function mergeMonsterCollections(localCollection, remoteCollection, legacyXP = 0) {
  const local = normalizeMonsterCollection(localCollection, { totalXP: legacyXP });
  const remote = normalizeMonsterCollection(remoteCollection, { totalXP: legacyXP });
  const byId = new Map();

  for (const monster of [...remote.monsters, ...local.monsters]) {
    const existing = byId.get(monster.id);
    byId.set(monster.id, {
      ...monster,
      totalXP: Math.max(existing?.totalXP ?? 0, monster.totalXP),
    });
  }

  const monsters = Array.from(byId.values());
  const activeId = monsters.some(monster => monster.id === local.activeId)
    ? local.activeId
    : monsters[0]?.id;

  return normalizeMonsterCollection({ version: 1, activeId, monsters });
}

export async function uploadProgress({ stats, unlockedPoolSize, monsterCollection }) {
  const user = await requireSignedInUser();
  const normalizedCollection = normalizeMonsterCollection(monsterCollection);
  const activeMonster = getActiveMonster(normalizedCollection);

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
        monster_total_xp: clampMonsterXP(activeMonster.totalXP),
        active_monster_id: normalizedCollection.activeId,
        monster_collection: normalizedCollection,
      },
      { onConflict: "user_id" },
    );
  if (metaError?.code === "PGRST204" || metaError?.code === "42703") {
    const { error: fallbackError } = await supabase
      .from("user_meta")
      .upsert(
        {
          user_id: user.id,
          unlocked_pool_size: unlockedPoolSize,
          monster_total_xp: clampMonsterXP(activeMonster.totalXP),
        },
        { onConflict: "user_id" },
      );
    if (fallbackError) throw fallbackError;
    return;
  }
  if (metaError) throw metaError;
}

export async function downloadAndMerge({ stats, unlockedPoolSize, monsterCollection }) {
  const user = await requireSignedInUser();

  const { data: remoteWords, error: wordsError } = await supabase
    .from("word_stats")
    .select("word_id, correct, wrong")
    .eq("user_id", user.id);
  if (wordsError) throw wordsError;

  let { data: remoteMeta, error: metaError } = await supabase
    .from("user_meta")
    .select("unlocked_pool_size, monster_total_xp, active_monster_id, monster_collection")
    .eq("user_id", user.id)
    .maybeSingle();
  if (metaError?.code === "42703" || metaError?.code === "PGRST204") {
    const fallback = await supabase
      .from("user_meta")
      .select("unlocked_pool_size, monster_total_xp")
      .eq("user_id", user.id)
      .maybeSingle();
    remoteMeta = fallback.data;
    metaError = fallback.error;
  }
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

  const remoteCollection = remoteMeta?.monster_collection
    ? {
        ...remoteMeta.monster_collection,
        activeId: remoteMeta.active_monster_id ?? remoteMeta.monster_collection.activeId,
      }
    : null;
  const mergedCollection = mergeMonsterCollections(
    monsterCollection,
    remoteCollection,
    remoteMeta?.monster_total_xp ?? 0,
  );

  return {
    stats: mergedStats,
    unlockedPoolSize: Math.max(
      unlockedPoolSize,
      remoteMeta?.unlocked_pool_size ?? 0,
    ),
    monsterCollection: mergedCollection,
  };
}
