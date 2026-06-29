function kanaToHiragana(value: string): string {
  return String(value ?? "").replace(/[\u30A1-\u30F6]/g, char =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

export function normalizeAnswer(value: string): string {
  return kanaToHiragana(String(value ?? ""))
    .normalize("NFKC")
    .replace(/[\u007E\uFF5E\u301C\u223C]/g, "〜")
    .replace(/[‐-‒–—―ーｰ]/g, "ー")
    .replace(/[、。，．・･!！?？"'“”‘’`´()[\]{}<>＜＞「」『』【】]/g, "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function normalizeForMorphology(value: string): string {
  return kanaToHiragana(String(value ?? ""))
    .normalize("NFKC")
    .replace(/[\u007E\uFF5E\u301C\u223C]/g, "〜")
    .replace(/[‐-‒–—―ーｰ]/g, "ー")
    .replace(/[、。，．・･!！?？"'“”‘’`´()[\]{}<>＜＞「」『』【】]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
