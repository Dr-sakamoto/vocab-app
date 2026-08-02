/** 重み付き抽選。重みが大きいインデックスほど選ばれやすい */
export function weightedPickIndex(
  indices: number[],
  getWeight: (i: number) => number,
): number | null {
  const weighted = indices.map((i) => ({
    index: i,
    weight: Math.max(0.01, getWeight(i)),
  }));
  const total = weighted.reduce((s, x) => s + x.weight, 0);
  let cursor = Math.random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.index;
  }
  return weighted.at(-1)?.index ?? null;
}
