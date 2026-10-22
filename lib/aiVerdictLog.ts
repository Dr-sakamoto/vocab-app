import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { normalizeAnswer } from "./answerNormalization";
import { VOCAB_ITEMS, wordIndexOf } from "./vocab";

// =====================================================
// AI判定の結果を語×回答ごとにサーバーへ集計する（サーバー専用）。
//
// AIが正解と認めた回答は、判定した端末の localStorage にしか残らず、
// 正解データ（lib/vocab/）は直らなかった。よく認められる回答を集めて
// 人が確認し、正解データへ反映する材料にする（テーブル定義は
// supabase/migrations/20261021000000_add_ai_answer_verdicts.sql）。
//
// 記録は採点の付録でしかない。設定が無い・失敗したときは黙って諦め、
// 採点そのものには一切影響させない。
// =====================================================

let cachedClient: SupabaseClient | null | undefined;

/** service_role で書き込むクライアント。キーが無ければ null（＝記録しない） */
function getClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  cachedClient =
    url && serviceKey
      ? createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return cachedClient;
}

export interface AiVerdictRecord {
  wordId: string;
  answer: string;
  approved: boolean;
}

/**
 * 記録してよい内容に整える。収録語に無いID、target が食い違うもの
 * （クライアントの偽装）、空の回答は null。
 * /api/check は認証なしの公開エンドポイントなので、集計を汚す入力は
 * ここで落とす。
 */
export function toAiVerdictRecord(
  wordId: unknown,
  target: string,
  input: string,
  approved: boolean,
): AiVerdictRecord | null {
  if (typeof wordId !== "string") return null;
  const index = wordIndexOf(wordId);
  if (index === null || VOCAB_ITEMS[index].target !== target) return null;
  const answer = normalizeAnswer(input);
  if (!answer) return null;
  return { wordId, answer, approved };
}

export async function recordAiVerdict(record: AiVerdictRecord): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    const { error } = await client.rpc("record_ai_answer_verdict", {
      p_word_id: record.wordId,
      p_answer: record.answer,
      p_approved: record.approved,
    });
    if (error) console.error("ai verdict log failed", error.message);
  } catch (error) {
    console.error("ai verdict log failed", error);
  }
}
