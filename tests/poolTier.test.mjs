import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { POOL_TIERS, getPoolTier } from "../lib/poolTier.js";
import { GAME } from "../lib/constants.js";

// 現行（変更前）の POOL_TIERS。既存ユーザーの倍率が後退しないことの基準値として固定する。
const LEGACY_POOL_TIERS = [
  { minPool: 3000, multiplier: 13 },
  { minPool: 2600, multiplier: 11 },
  { minPool: 2200, multiplier: 9 },
  { minPool: 1800, multiplier: 7 },
  { minPool: 1400, multiplier: 5 },
  { minPool: 1000, multiplier: 4 },
  { minPool: 600, multiplier: 3 },
  { minPool: 300, multiplier: 2 },
  { minPool: 60, multiplier: 1 },
];

function legacyTier(poolSize) {
  return (
    LEGACY_POOL_TIERS.find((t) => poolSize >= t.minPool) ?? LEGACY_POOL_TIERS.at(-1)
  );
}

function readAuditRows() {
  const [header, ...lines] = readFileSync(
    new URL("../docs/vocab-difficulty.csv", import.meta.url),
    "utf8",
  )
    .trim()
    .split("\n");
  const columns = header.split(",");
  return lines.map((line) => {
    const cells = [];
    let cur = "";
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) {
        cells.push(cur);
        cur = "";
      } else cur += ch;
    }
    cells.push(cur);
    return Object.fromEntries(columns.map((c, i) => [c, cells[i]]));
  });
}

const auditRows = readAuditRows();

// CSV の effectiveBand（整数部）から、バンドごとの最初の語の序列 order を算出する。
function bandStartOrders() {
  const starts = new Map();
  for (const row of auditRows) {
    const band = Math.trunc(Number(row.effectiveBand));
    if (!starts.has(band)) starts.set(band, Number(row.order));
  }
  return starts;
}

test("CSV から算出したバンド境界が期待値と一致する（ハードコードした数字を鵜呑みにしない）", () => {
  const starts = bandStartOrders();
  assert.deepEqual(Object.fromEntries(starts), {
    0: 0, // A1
    1: 10, // A2
    2: 113, // B1
    3: 745, // B2
    4: 2125, // C1
    5: 3324, // C2
  });
});

test("Tier 境界はすべて CEFR バンド境界と一致する（バンドの途中でTierが切れない）", () => {
  const starts = bandStartOrders();
  const bandMinPools = new Set([...starts.values()].map((order) => order + 1));

  const tierMinPools = new Set(POOL_TIERS.map((t) => t.minPool));
  for (const minPool of bandMinPools) {
    assert.ok(
      tierMinPools.has(minPool),
      `バンド境界 minPool=${minPool} に対応する Tier 境界がない`,
    );
  }
});

test("Tier のラベル・カラーはすべて一意", () => {
  assert.equal(new Set(POOL_TIERS.map((t) => t.label)).size, POOL_TIERS.length);
  assert.equal(new Set(POOL_TIERS.map((t) => t.color)).size, POOL_TIERS.length);
});

test("Tier は minPool の降順で並んでいる（getPoolTier の find が最初に一致する最上位を拾う）", () => {
  for (let i = 1; i < POOL_TIERS.length; i += 1) {
    assert.ok(POOL_TIERS[i - 1].minPool > POOL_TIERS[i].minPool);
  }
});

test("倍率は poolSize が増えるほど単調に大きくなる", () => {
  for (let i = 1; i < POOL_TIERS.length; i += 1) {
    assert.ok(POOL_TIERS[i - 1].multiplier > POOL_TIERS[i].multiplier);
  }
});

test("同じ unlockedPoolSize で獲得倍率が現行を下回らない（全 poolSize 1〜3440）", () => {
  const regressions = [];
  for (let poolSize = 1; poolSize <= 3440; poolSize += 1) {
    const oldMultiplier = legacyTier(poolSize).multiplier;
    const newMultiplier = getPoolTier(poolSize).multiplier;
    if (newMultiplier < oldMultiplier) {
      regressions.push(`poolSize=${poolSize}: ${oldMultiplier} -> ${newMultiplier}`);
    }
  }
  assert.deepEqual(regressions, []);
});

test("現行の全 Tier 境界値でも倍率が後退しない", () => {
  for (const legacy of LEGACY_POOL_TIERS) {
    const newMultiplier = getPoolTier(legacy.minPool).multiplier;
    assert.ok(
      newMultiplier >= legacy.multiplier,
      `minPool=${legacy.minPool}: 現行${legacy.multiplier} -> 新${newMultiplier}`,
    );
  }
});

test("入門帯（A1+A2）をまるごと解放するサイズに INITIAL_POOL_SIZE が一致する", () => {
  const starts = bandStartOrders();
  const b1Start = starts.get(2); // B1 の最初の語の order
  assert.equal(GAME.INITIAL_POOL_SIZE, b1Start, "B1 に入る手前（入門帯を1周した数）であること");
});
