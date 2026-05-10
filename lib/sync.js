/**
 * lib/sync.js
 *
 * Supabaseとの進捗同期ユーティリティ。
 * マージ戦略: 各単語ごとに correct/wrong それぞれ大きい方を採用。
 * unlockedPoolSize / monsterTotalXP も大きい方を採用。
 */

import { supabase } from "./supabase";
import { QUESTIONS } from "./vocab";

const VOCAB_IDS = QUESTIONS.map((_, i) => `w${i}`);

// ─────────────────────────────────────────────────────────────
// 匿名サインイン（初回のみ）
// ─────────────────────────────────────────────────────────────
export async function ensureSignedIn() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

// ─────────────────────────────────────────────────────────────
// アップロード: ローカルの状態をSupabaseへ保存
// ─────────────────────────────────────────────────────────────
export async function uploadProgress({ stats, unlockedPoolSize, monsterTotalXP }) {
  const user = await ensureSignedIn();

  // 単語進捗
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

  // メタデータ
  const { error: metaError } = await supabase
    .from("user_meta")
    .upsert(
      { user_id: user.id, unlocked_pool_size: unlockedPoolSize, monster_total_xp: monsterTotalXP },
      { onConflict: "user_id" }
    );
  if (metaError) throw metaError;
}

// ─────────────────────────────────────────────────────────────
// ダウンロード: Supabaseから取得してローカルとマージ
// ─────────────────────────────────────────────────────────────
export async function downloadAndMerge({ stats, unlockedPoolSize, monsterTotalXP }) {
  const user = await ensureSignedIn();

  // 単語進捗取得
  const { data: remoteWords, error: wordsError } = await supabase
    .from("word_stats")
    .select("word_id, correct, wrong")
    .eq("user_id", user.id);
  if (wordsError) throw wordsError;

  // メタ取得
  const { data: remoteMeta, error: metaError } = await supabase
    .from("user_meta")
    .select("unlocked_pool_size, monster_total_xp")
    .eq("user_id", user.id)
    .single();
  if (metaError && metaError.code !== "PGRST116") throw metaError; // PGRST116 = row not found

  // マージ: 単語ごとに大きい方を採用
  const remoteMap = new Map(remoteWords?.map((r) => [r.word_id, r]) ?? []);
  const mergedStats = VOCAB_IDS.map((id, i) => {
    const local = stats[i] ?? { correct: 0, wrong: 0 };
    const remote = remoteMap.get(id) ?? { correct: 0, wrong: 0 };
    return {
      correct: Math.max(local.correct, remote.correct),
      wrong: Math.max(local.wrong, remote.wrong),
    };
  });

  // メタマージ
  const mergedPoolSize = Math.max(
    unlockedPoolSize,
    remoteMeta?.unlocked_pool_size ?? 0
  );
  const mergedXP = Math.max(
    monsterTotalXP,
    remoteMeta?.monster_total_xp ?? 0
  );

  return {
    stats: mergedStats,
    unlockedPoolSize: mergedPoolSize,
    monsterTotalXP: mergedXP,
  };
}
