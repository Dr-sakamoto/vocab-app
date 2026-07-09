import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 認証なしの公開エンドポイントなので、乱用によるGemini API課金の
// 急増を防ぐための最低限の入力上限とレート制限。
const MAX_INPUT_LENGTH = 200;
const MAX_TARGET_LENGTH = 100;
const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

function getClientIp(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = checkRateLimit(`ai-review:${ip}`, RATE_LIMIT);
    if (!allowed) {
      return Response.json(
        { approved: false, score: 0, feedback: "リクエストが多すぎます。少し待ってから再試行してください" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
      );
    }

    const { input, target } = await req.json();

    if (
      typeof input !== "string" ||
      typeof target !== "string" ||
      !input.trim() ||
      !target.trim()
    ) {
      return Response.json({ approved: false, score: 0, feedback: "入力が不正です" }, { status: 400 });
    }
    if (input.length > MAX_INPUT_LENGTH || target.length > MAX_TARGET_LENGTH) {
      return Response.json({ approved: false, score: 0, feedback: "入力が長すぎます" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(
      `英語「${target}」の日本語訳として「${input}」は適切ですか？
0〜100のスコアと短い理由をJSONで返してください。70点以上が合格です。
{"score": 数値, "feedback": "理由（15字以内）"}
JSONのみ返答してください。`,
    );
    const message = { content: [{ text: result.response.text() }] };

    const text = message.content[0].text.trim();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { score: 0, feedback: "解析エラー" };
    }

    const score = Number(parsed.score ?? 0);
    return Response.json({
      approved: score >= 70,
      score,
      feedback: parsed.feedback ?? "",
    });
  } catch (error) {
    console.error("ai-review failed", error);
    return Response.json(
      { approved: false, score: 0, feedback: "AI審議に失敗しました" },
      { status: 500 },
    );
  }
}
