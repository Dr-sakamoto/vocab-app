import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { input, target } = await req.json();

    if (!input || !target) {
      return Response.json({ approved: false, score: 0, feedback: "入力が不正です" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
