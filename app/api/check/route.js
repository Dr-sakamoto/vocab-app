import { evaluateAnswer } from "@/lib/answerEvaluation";
import { judgeAnswerWithAi, isAiReviewConfigured } from "@/lib/aiReview";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// -----------------------------------------------------
// 回答判定の単一窓口。
//
//   1. 完全一致 / 形態素解析 + 同義語テーブル（evaluateAnswer）
//   2. それでも不正解なら、その場でAIに判定させる
//
// 2 をユーザーのボタン操作に任せると、正解しているのに
// 「不正解 → ボタンを探して押す → 待つ」という割り込みが
// 毎回コアループに入る。判定は1往復で確定させる。
// -----------------------------------------------------

const MAX_INPUT_LENGTH = 200;
const MAX_TARGET_LENGTH = 100;
const MAX_COLLOCATION_LENGTH = 100;
const MAX_ANSWERS = 20;

// 認証なしの公開エンドポイント。形態素解析のCPUとAIの従量課金の
// 両方を守る必要があるため、2段構えで制限する。
const REQUEST_RATE_LIMIT = { limit: 120, windowMs: 60_000 };
// AIだけは別枠でより厳しく。上限に達しても 429 は返さず、
// AI判定を諦めて通常の判定結果を返す（採点自体は止めない）。
const AI_RATE_LIMIT = { limit: 20, windowMs: 60_000 };

function getClientIp(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = checkRateLimit(`check:${ip}`, REQUEST_RATE_LIMIT);
    if (!allowed) {
      return Response.json(
        { status: "wrong", error: "RATE_LIMITED" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        },
      );
    }

    const body = await req.json();
    const input = typeof body?.input === "string" ? body.input : "";
    // target はAIプロンプトに埋め込まれる。クライアント由来の文字列なので
    // 長さを制限しておく。なお target/answers を偽装できてしまうが、
    // 成績は本人のものでしかなく、偽装しても自分が損をするだけ
    // （＝信頼境界ではない）。課金特典の判定には使わないこと。
    const target = typeof body?.target === "string" ? body.target : "";
    // 句動詞の意味を固定する目的語。target と同じくプロンプトに埋め込まれる。
    const collocation =
      typeof body?.collocation === "string" ? body.collocation : "";
    const partOfSpeech =
      typeof body?.partOfSpeech === "string" ? body.partOfSpeech : undefined;
    const answers = Array.isArray(body?.answers)
      ? body.answers.filter((a) => typeof a === "string").slice(0, MAX_ANSWERS)
      : [];

    if (
      input.length > MAX_INPUT_LENGTH ||
      target.length > MAX_TARGET_LENGTH ||
      collocation.length > MAX_COLLOCATION_LENGTH
    ) {
      return Response.json(
        { status: "wrong", error: "INPUT_TOO_LONG" },
        { status: 400 },
      );
    }

    const result = await evaluateAnswer({ input, answers, partOfSpeech });
    if (result.status !== "wrong") {
      return Response.json(result);
    }

    // ここから先はAIの出番。空入力や単語不明のときは呼ぶだけ無駄。
    if (!input.trim() || !target.trim() || !isAiReviewConfigured()) {
      return Response.json(result);
    }

    const aiAllowed = checkRateLimit(`check-ai:${ip}`, AI_RATE_LIMIT).allowed;
    if (!aiAllowed) {
      return Response.json(result);
    }

    const verdict = await judgeAnswerWithAi({ input, target, collocation });
    // null は「AI判定なし」。既存の判定結果をそのまま返す。
    if (!verdict) {
      return Response.json(result);
    }

    return Response.json({
      ...result,
      status: verdict.approved ? "ai_approved" : result.status,
      aiScore: verdict.score,
      aiFeedback: verdict.feedback,
    });
  } catch (error) {
    console.error("answer check failed", error);
    return Response.json(
      { status: "wrong", error: "ANSWER_CHECK_FAILED" },
      { status: 500 },
    );
  }
}
