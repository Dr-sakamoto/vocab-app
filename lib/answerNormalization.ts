function kanaToHiragana(value: string): string {
  return String(value ?? "").replace(/[ァ-ヶ]/g, char =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

// 「（データを）検索する」のような用法注記を、括弧記号ごと除去する。
// 訳語全体が括弧内に収まっている場合など、除去すると空文字になるときは
// 注記を落とさず元の文字列のまま返す。
function stripParenthetical(value: string): string {
  const stripped = value.replace(/\([^()]*\)/g, "");
  return stripped.trim() ? stripped : value;
}

export function normalizeAnswer(value: string): string {
  const base = kanaToHiragana(String(value ?? ""))
    .normalize("NFKC")
    .replace(/[~～〜∼]/g, "〜")
    .replace(/[‐-‒–—―ーｰ]/g, "ー");

  return stripParenthetical(base)
    .replace(/[、。，．・･!！?？"'“”‘’`´()[\]{}<>＜＞「」『』【】]/g, "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function normalizeForMorphology(value: string): string {
  const base = kanaToHiragana(String(value ?? ""))
    .normalize("NFKC")
    .replace(/[~～〜∼]/g, "〜")
    .replace(/[‐-‒–—―ーｰ]/g, "ー");

  return stripParenthetical(base)
    .replace(/[、。，．・･!！?？"'“”‘’`´()[\]{}<>＜＞「」『』【】]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
