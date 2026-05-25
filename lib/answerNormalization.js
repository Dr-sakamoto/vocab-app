export function normalizeAnswer(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u007E\uFF5E\u301C\u223C]/g, "〜")
    .replace(/[‐-‒–—―ーｰ]/g, "ー")
    .replace(/[、。，．・･!！?？"'“”‘’`´()[\]{}<>＜＞「」『』【】]/g, "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function normalizeForMorphology(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u007E\uFF5E\u301C\u223C]/g, "〜")
    .replace(/[‐-‒–—―ーｰ]/g, "ー")
    .replace(/[、。，．・･!！?？"'“”‘’`´()[\]{}<>＜＞「」『』【】]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
