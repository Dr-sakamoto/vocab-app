import assert from "node:assert/strict";
import test from "node:test";

import { POOL_TIERS, getPoolTier } from "../lib/poolTier.js";

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

// Tier 境界は、出題順がCEFRバンド主軸だった頃のバンド境界から決めたもの。
// 出題順を出る順主軸へ変えた後は、境界はCEFRバンドと対応しない
// （ラベル A1〜C2 の見直しは別途）。境界を動かすと獲得倍率が変わるので、
// ラベルを見直すまでは語数の値そのものを固定しておく。
test("Tier 境界の語数は従来のまま（出題順の変更で獲得倍率を動かさない）", () => {
  assert.deepEqual(
    POOL_TIERS.map((t) => t.minPool),
    [3325, 2726, 2126, 1666, 1206, 746, 430, 114, 11, 1],
  );
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
