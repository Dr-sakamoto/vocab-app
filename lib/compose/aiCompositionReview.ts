import { GoogleGenerativeAI } from "@google/generative-ai";
import { findGrammarTag, isGrammarTagId } from "./grammarTags";
import type { ComposeDirection, TagJudgement, TagVerdict } from "./types";

// =====================================================
// 英作文・和訳のAI採点。
//
// 単語アプリのAI判定（lib/aiReview.ts）は「この訳語は正解か」の二値を
// 求めるものだったが、こちらは採点そのものをAIに任せる。自由記述の
// 英作文は模範解答と一致しないのが普通で、正解の集合を人手で列挙する
// ことができないため。
//
// lib/aiReview.ts と同じ約束を引き継ぐ:
//   判定できなかったときは null を返す。呼び出し側はそれを
//   「AI採点なし」として扱い、模範解答との照合（localGrade）へ落とす。
//   AIの不調が採点を止めてはいけない。
// =====================================================

const AI_MODEL = "gemini-2.5-flash";

/**
 * 採点の待ち時間の上限。
 *
 * 単語の判定（6秒）より長く取る。答案が文である以上、生成する
 * 添削文も長く、6秒では切れることがあるため。長く待てるのは、
 * 採点が回答の裏で走っていて、学習者は次の問題を書いているから
 * （画面はこの待ち時間のあいだ止まらない）。
 */
export const COMPOSITION_TIMEOUT_MS = 15_000;

/** feedback / good / note が長すぎるとカードが読み物になってしまう */
const MAX_FEEDBACK_LENGTH = 120;
const MAX_GOOD_LENGTH = 60;
const MAX_NOTE_LENGTH = 50;
const MAX_CORRECTED_LENGTH = 400;

export interface AiCompositionVerdict {
  score: number;
  corrected: string;
  feedback: string;
  good: string;
  tags: TagJudgement[];
}

export function isAiCompositionConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

let cachedClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
}

export interface CompositionPromptParams {
  /** 出題文（英作文なら和文、和訳なら英文） */
  question: string;
  input: string;
  answers: string[];
  /** この問題が試している文法タグのID */
  tagIds: string[];
  direction: ComposeDirection;
}

/**
 * 採点用のプロンプトを組み立てる。
 *
 * 方針:
 * - 模範解答は「参考」であって正解の唯一形ではないと明示する。これを
 *   書かないと、模範解答と語句が違うだけの正しい文まで容赦なく削られ、
 *   学習者は自分の英語ではなく模範解答の暗記を始める。
 * - タグごとの判定を必ず全タグぶん返させる。弱点データの欠測を作らない。
 * - できていた点（good）を必ず1つ返させる。続ける理由になるのはここ。
 */
export function buildCompositionPrompt({
  question,
  input,
  answers,
  tagIds,
  direction,
}: CompositionPromptParams): string {
  const tagLines = tagIds
    .map((id) => {
      const tag = findGrammarTag(id);
      return tag ? `- ${id}: ${tag.label}（${tag.description}）` : null;
    })
    .filter((line): line is string => line !== null)
    .join("\n");

  const header =
    direction === "ja-to-en"
      ? `あなたは日本人学習者の英作文を採点する経験豊富な英語教師です。

【和文（設問）】
${question}

【学習者の英文】
${input}

【模範解答（参考。これと違ってもよい）】
${answers.map((answer) => `- ${answer}`).join("\n")}`
      : `あなたは日本人学習者の英文和訳を採点する経験豊富な英語教師です。

【英文（設問）】
${question}

【学習者の和訳】
${input}

【模範となる和訳（参考。これと違ってもよい）】
${answers.map((answer) => `- ${answer}`).join("\n")}`;

  const criteria =
    direction === "ja-to-en"
      ? `採点の方針:
- 設問の意味が伝わるかを最優先で見る。模範解答と語句が違っても、文法的に正しく自然なら減点しない
- 文法・語法・語順の誤りは減点し、corrected で直す
- corrected は学習者の文をできるだけ活かした最小限の修正にする（模範解答への置き換えは避ける）
- 綴りの単純ミスは軽い減点に留める`
      : `採点の方針:
- 英文の意味を取り違えていないかを最優先で見る。日本語の言い回しが模範と違っても、意味が正しく自然なら減点しない
- 構文の読み違い（否定・時制・修飾関係）は重く減点し、corrected で直す
- corrected は学習者の訳をできるだけ活かした最小限の修正にする`;

  return `${header}

【この問題が試している文法・表現】
${tagLines || "- （指定なし）"}

${criteria}

次のJSONだけを返してください（説明文やコードブロックは不要）。
{"score": 0〜100の整数, "corrected": "添削後の文", "feedback": "減点の理由を日本語60字以内で。減点が無ければ良い点を書く", "good": "できていた点を日本語30字以内で1つ", "tags": [{"id": "タグID", "verdict": "ok|shaky|missed", "note": "日本語25字以内"}]}

tags には上に挙げたタグIDだけを、1つずつすべて含めてください。
verdict は ok（狙い通り使えている）/ shaky（惜しい・不自然）/ missed（使えていない・誤り）から選びます。
score は 80以上が合格、60〜79が惜しい、59以下が要復習の目安です。`;
}

function toScore(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}…` : trimmed;
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

const VERDICTS = new Set<TagVerdict>(["ok", "shaky", "missed"]);

/**
 * AIが返したタグ判定を、こちらのタグ表に照らして絞り込む。
 *
 * AIは頼んでいないIDを作る（"grammar" や "articles-plural" など）。
 * 未定義のIDをそのまま統計に入れると、分析画面に出題できない弱点が
 * 並ぶので、必ずここで落とす。`allowedTagIds` を渡した場合は、
 * その問題が試しているタグ以外の判定も落とす（別のタグの成績が
 * 「ついで」で動くと、弱点の因果が読めなくなる）。
 */
export function sanitizeTagJudgements(
  raw: unknown,
  allowedTagIds?: string[],
): TagJudgement[] {
  if (!Array.isArray(raw)) return [];
  const allowed = allowedTagIds ? new Set(allowedTagIds) : null;
  const seen = new Set<string>();
  const out: TagJudgement[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!isGrammarTagId(id)) continue;
    if (allowed && !allowed.has(id)) continue;
    if (seen.has(id)) continue;

    const verdict = typeof item.verdict === "string" ? item.verdict.trim() : "";
    if (!VERDICTS.has(verdict as TagVerdict)) continue;

    seen.add(id);
    out.push({
      id,
      verdict: verdict as TagVerdict,
      note: toText(item.note, MAX_NOTE_LENGTH),
    });
  }
  return out;
}

/**
 * モデルの応答から採点を取り出す。読めなければ null（＝AI採点なし）。
 *
 * score が読めない応答は捨てる。0点に丸めてはいけない——「AIが0点と
 * 判定した」のか「応答が壊れていた」のかを呼び出し側が区別できなくなる。
 */
export function parseCompositionVerdict(
  rawText: unknown,
  allowedTagIds?: string[],
): AiCompositionVerdict | null {
  if (typeof rawText !== "string") return null;
  const text = rawText.trim();
  if (!text) return null;

  const parsed = parseJsonObject(text);
  if (!parsed) return null;

  const score = toScore(parsed.score);
  if (score === null) return null;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    corrected: toText(parsed.corrected, MAX_CORRECTED_LENGTH),
    feedback: toText(parsed.feedback, MAX_FEEDBACK_LENGTH),
    good: toText(parsed.good, MAX_GOOD_LENGTH),
    tags: sanitizeTagJudgements(parsed.tags, allowedTagIds),
  };
}

export interface JudgeCompositionParams extends CompositionPromptParams {
  timeoutMs?: number;
}

/**
 * AIに1答案だけ採点させる。
 * 未設定・通信失敗・タイムアウト・応答不正はすべて null を返す。
 */
export async function judgeCompositionWithAi({
  question,
  input,
  answers,
  tagIds,
  direction,
  timeoutMs = COMPOSITION_TIMEOUT_MS,
}: JudgeCompositionParams): Promise<AiCompositionVerdict | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: {
        // 採点は再現性が要る。同じ答案が試行ごとに違う点数になってはいけない。
        temperature: 0,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(
      buildCompositionPrompt({ question, input, answers, tagIds, direction }),
      { timeout: timeoutMs },
    );

    return parseCompositionVerdict(result.response.text(), tagIds);
  } catch (error) {
    console.error("composition review failed", error);
    return null;
  }
}
