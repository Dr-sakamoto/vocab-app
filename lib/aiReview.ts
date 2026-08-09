import { GoogleGenerativeAI } from "@google/generative-ai";

// =====================================================
// 記述式回答のAI判定。
// 形態素解析＋同義語テーブル（answerEvaluation）で拾えなかった
// 表記ゆれ・同義語を、最後の砦としてAIに判定させる。
//
// 重要: このモジュールは「判定できなかった」ことを null で表す。
// 呼び出し側は null を「AI判定なし」として扱い、既存の判定結果
// （不正解）をそのまま採用すること。AIの不調が採点を壊してはいけない。
// =====================================================

/** この点数以上でAIが「正解」と認める */
export const AI_APPROVAL_THRESHOLD = 70;

const AI_MODEL = "gemini-2.5-flash";

/**
 * AI判定の待ち時間の上限。
 * 不正解時のみ発火するとはいえ、ここで待たされる時間はそのまま
 * コアループの停止時間になる。長く待つくらいなら不正解で先へ進める。
 */
export const AI_TIMEOUT_MS = 6_000;

export interface AiVerdict {
  approved: boolean;
  score: number;
  feedback: string;
}

/**
 * モデルの応答テキストから判定を取り出す。
 * 解析できなければ null（＝AI判定なし）。0点に丸めてはいけない。
 * 「AIが不正解と断じた」のか「応答が壊れていた」のかを
 * 呼び出し側が区別できなくなるため。
 */
export function parseAiVerdict(rawText: unknown): AiVerdict | null {
  if (typeof rawText !== "string") return null;
  const text = rawText.trim();
  if (!text) return null;

  const parsed = parseJsonObject(text);
  if (!parsed) return null;

  const score = toScore(parsed.score);
  if (score === null) return null;

  const clamped = Math.max(0, Math.min(100, score));
  const feedback =
    typeof parsed.feedback === "string" ? parsed.feedback.trim() : "";

  return {
    approved: clamped >= AI_APPROVAL_THRESHOLD,
    score: clamped,
    feedback,
  };
}

/**
 * スコアとして採用できる値だけを数値にする。
 * Number() に直接通すと null・""・true が 0 や 1 になり、
 * 「AIが0点と判定した」と区別できなくなるため自前で絞る。
 */
function toScore(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** そのままJSONとして読む。だめならテキスト中の最初の { ... } を試す */
function parseJsonObject(text: string): Record<string, unknown> | null {
  const candidates = [text];
  const embedded = text.match(/\{[\s\S]*\}/);
  if (embedded) candidates.push(embedded[0]);

  for (const candidate of candidates) {
    try {
      const value = JSON.parse(candidate);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
      }
    } catch {
      // 次の候補を試す
    }
  }
  return null;
}

/** GEMINI_API_KEY が無い環境ではAI判定を丸ごと無効化する */
export function isAiReviewConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

let cachedClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
}

export function buildReviewPrompt(input: string, target: string): string {
  return `英語「${target}」の日本語訳として「${input}」は適切ですか？
0〜100のスコアと短い理由をJSONで返してください。${AI_APPROVAL_THRESHOLD}点以上が合格です。
{"score": 数値, "feedback": "理由（15字以内）"}
JSONのみ返答してください。`;
}

export interface JudgeAnswerProps {
  input: string;
  target: string;
  timeoutMs?: number;
}

/**
 * AIに1件だけ判定させる。
 * 未設定・通信失敗・タイムアウト・応答不正は全て null を返す。
 */
export async function judgeAnswerWithAi({
  input,
  target,
  timeoutMs = AI_TIMEOUT_MS,
}: JudgeAnswerProps): Promise<AiVerdict | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: {
        // 採点は再現性が要る。同じ回答が試行ごとに違う判定になってはいけない。
        temperature: 0,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(buildReviewPrompt(input, target), {
      timeout: timeoutMs,
    });

    return parseAiVerdict(result.response.text());
  } catch (error) {
    console.error("ai review failed", error);
    return null;
  }
}
