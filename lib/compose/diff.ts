// =====================================================
// 自分の文と添削後の文の差分。
//
// 添削文をただ並べて見せると、学習者は「どこが変わったのか」を目で
// 探すところから始めることになる。書いた本人にしか分からない差分を
// 機械が示せる場面なので、語単位で色分けして出す。
// =====================================================

export type DiffType = "same" | "added" | "removed";

export interface DiffSegment {
  type: DiffType;
  text: string;
}

/**
 * 差分計算に載せる語数の上限。
 * LCS は語数の二乗で効くため、長文を貼られたときに画面が固まらないよう
 * 打ち切る。1答案は長くても40語程度なので、通常は届かない。
 */
const MAX_TOKENS = 160;

/** 比較のためだけに使う正規化（表示は元の語をそのまま出す） */
function key(token: string): string {
  return token.toLowerCase().replace(/[.,!?;:"“”'’()]/g, "");
}

function splitWords(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).slice(0, MAX_TOKENS);
}

/**
 * 語単位の差分。`before`（自分の文）から `after`（添削文）への変換を
 * same / removed / added の並びで返す。
 *
 * 連続する同種の語はひとつの区間にまとめる。1語ずつ色が切り替わると、
 * 直された箇所より装飾のほうが目立って読めなくなる。
 */
export function diffWords(before: string, after: string): DiffSegment[] {
  const a = splitWords(before);
  const b = splitWords(after);

  // LCS の長さ表。a[i:] と b[j:] の最長共通部分列。
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lcs[i][j] =
        key(a[i]) === key(b[j])
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const segments: DiffSegment[] = [];
  const push = (type: DiffType, text: string) => {
    const last = segments[segments.length - 1];
    if (last && last.type === type) {
      last.text += ` ${text}`;
      return;
    }
    segments.push({ type, text });
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (key(a[i]) === key(b[j])) {
      push("same", a[i]);
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push("removed", a[i]);
      i += 1;
    } else {
      push("added", b[j]);
      j += 1;
    }
  }
  while (i < a.length) {
    push("removed", a[i]);
    i += 1;
  }
  while (j < b.length) {
    push("added", b[j]);
    j += 1;
  }

  return segments;
}

/** 添削で実際に手が入ったか（差分がゼロなら添削文を見せる意味がない） */
export function hasEdits(segments: DiffSegment[]): boolean {
  return segments.some((segment) => segment.type !== "same");
}
