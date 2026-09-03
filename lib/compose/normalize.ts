// =====================================================
// 答案を突き合わせるための正規化。
//
// 採点の本体はAIだが、AIが使えない環境（APIキー未設定・レート制限・
// 通信失敗）ではここの正規化と lib/compose/localGrade.ts の照合だけが
// 頼りになる。「大文字と小文字」「ピリオドの有無」「don't と do not」で
// 不正解になると、学習者は自分の英語ではなく表記の揺れを直しはじめる。
// =====================================================

/**
 * 縮約の展開表。
 * 逆向き（do not → don't）には展開しない。両方向に開くと
 * won't が will not と wo not のどちらにも化けるなど、
 * 展開の順序で結果が変わってしまう。
 */
const CONTRACTIONS: [RegExp, string][] = [
  [/\bcan't\b/g, "cannot"],
  [/\bwon't\b/g, "will not"],
  [/\bshan't\b/g, "shall not"],
  // doesn't / isn't / haven't … の n't。前に \b は置けない（does と n の
  // 間には語境界が無い）ので、後ろの境界だけを見る。
  [/n't\b/g, " not"],
  [/\bi'm\b/g, "i am"],
  [/\blet's\b/g, "let us"],
  [/\b(he|she|it|that|there|who|what|where)'s\b/g, "$1 is"],
  [/\b(i|you|we|they)'re\b/g, "$1 are"],
  [/\b(i|you|he|she|it|we|they)'ve\b/g, "$1 have"],
  [/\b(i|you|he|she|it|we|they)'ll\b/g, "$1 will"],
  [/\b(i|you|he|she|it|we|they)'d\b/g, "$1 would"],
];

/**
 * 英文を比較用に正規化する。
 * 小文字化 → 縮約の展開 → 句読点の除去 → 空白の畳み込み。
 *
 * アポストロフィは縮約を展開してから落とす。先に落とすと don t になり、
 * 展開表が当たらなくなる。
 */
export function normalizeEnglish(text: string): string {
  let out = text.toLowerCase().replace(/[‘’]/g, "'").trim();
  for (const [pattern, replacement] of CONTRACTIONS) {
    out = out.replace(pattern, replacement);
  }
  return out
    .replace(/[.,!?;:"“”()\[\]]/g, " ")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 正規化した英文を語に分ける */
export function tokenizeEnglish(text: string): string[] {
  const normalized = normalizeEnglish(text);
  return normalized ? normalized.split(" ") : [];
}

/**
 * 和文を比較用に正規化する。
 *
 * 日本語には語の切れ目が無いので、単語アプリのように形態素解析まで
 * 持ち込まず、和訳の照合は文字単位で行う（lib/compose/localGrade.ts）。
 * ここでは表記の揺れだけを畳む: 空白・句読点・記号の除去と、
 * 全角英数の半角化。
 */
export function normalizeJapanese(text: string): string {
  return text
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[\s　]/g, "")
    .replace(/[、。，．！？!?「」『』（）()・…ー─―~〜]/g, "")
    .toLowerCase();
}

/** 出題の向きに合わせた正規化 */
export function normalizeForDirection(text: string, direction: "ja-to-en" | "en-to-ja"): string {
  return direction === "ja-to-en" ? normalizeEnglish(text) : normalizeJapanese(text);
}
