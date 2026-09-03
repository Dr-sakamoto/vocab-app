import { COMPOSE } from "@/lib/compose/constants";
import {
  isAiCompositionConfigured,
  judgeCompositionWithAi,
} from "@/lib/compose/aiCompositionReview";
import { gradeLocally, toVerdict } from "@/lib/compose/localGrade";
import { findPrompt } from "@/lib/compose/prompts";
import { getExpectedAnswers, getQuestionText } from "@/lib/compose/question";
import type { ComposeDirection, CompositionGrade } from "@/lib/compose/types";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// -----------------------------------------------------
// 英作文・和訳の採点窓口。
//
// 設問・模範解答・狙いのタグはリクエストから受け取らず、`promptId` で
// サーバー側の出題データから引く。クライアントに持たせると、
//   - プロンプトに載る文字列がまるごと外部入力になる
//   - 出題データを書き換えて「常に満点が返る問題」を作れる
//   - 弱点タグを詐称して統計を汚せる
// の3つが同時に開く。IDだけ受ければ、そのどれも起きない。
//
// 採点は1往復で確定させる。AIが使えないとき（キー未設定・レート制限・
// 応答不正）は模範解答との照合で採点して返す——待たせた末に「採点
// できませんでした」を返すのが、学習者にとって最悪の結果なので。
// -----------------------------------------------------

// 1答案につき1回のAI呼び出しが走る。1セッション5〜8問を裏で並走させる
// ため、単語の判定より枠を広く取りつつ、従量課金の暴走は止める。
const REQUEST_RATE_LIMIT = { limit: 60, windowMs: 60_000 };
const AI_RATE_LIMIT = { limit: 40, windowMs: 60_000 };

const DIRECTIONS = new Set<ComposeDirection>(["ja-to-en", "en-to-ja"]);

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = checkRateLimit(`compose:${ip}`, REQUEST_RATE_LIMIT);
    if (!allowed) {
      return Response.json(
        { error: "RATE_LIMITED" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        },
      );
    }

    const body = await req.json();
    const promptId = typeof body?.promptId === "string" ? body.promptId : "";
    const input = typeof body?.input === "string" ? body.input : "";
    const direction: ComposeDirection = DIRECTIONS.has(body?.direction)
      ? body.direction
      : "ja-to-en";

    if (input.length > COMPOSE.MAX_INPUT_LENGTH) {
      return Response.json({ error: "INPUT_TOO_LONG" }, { status: 400 });
    }

    const prompt = findPrompt(promptId);
    if (!prompt) {
      return Response.json({ error: "UNKNOWN_PROMPT" }, { status: 400 });
    }

    const answers = getExpectedAnswers(prompt, direction);
    const local = gradeLocally({ input, answers, direction });

    // 空欄はAIに渡すだけ無駄（採点するものが無い）。
    if (!input.trim()) return Response.json(local);

    if (!isAiCompositionConfigured()) return Response.json(local);
    if (!checkRateLimit(`compose-ai:${ip}`, AI_RATE_LIMIT).allowed) {
      return Response.json(local);
    }

    const verdict = await judgeCompositionWithAi({
      question: getQuestionText(prompt, direction),
      input,
      answers,
      tagIds: [...prompt.tags],
      direction,
    });
    if (!verdict) return Response.json(local);

    const grade: CompositionGrade = {
      score: verdict.score,
      verdict: toVerdict(verdict.score),
      // 添削文が空で返ることがある（模範解答どおりの答案など）。
      // その場合は学習者の文をそのまま置き、差分ゼロとして描かせる。
      corrected: verdict.corrected || input.trim(),
      feedback: verdict.feedback,
      good: verdict.good,
      tags: verdict.tags,
      aiJudged: true,
    };
    return Response.json(grade);
  } catch (error) {
    console.error("composition check failed", error);
    return Response.json({ error: "COMPOSITION_CHECK_FAILED" }, { status: 500 });
  }
}
