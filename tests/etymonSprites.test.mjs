import assert from "node:assert/strict";
import test from "node:test";

import { MONSTER_LINES } from "../lib/monster.js";
import { getEtymonSpriteOverride } from "../lib/etymonSprites.js";
import etymonSpriteData from "../lib/etymonSprites.json" with { type: "json" };

const LINE_BY_ID = new Map(MONSTER_LINES.map((line) => [line.id, line]));

test("etymonSprites.json のキーは lineId:段階 形式で、実在する系統・段階を指す", () => {
  for (const [key, path] of Object.entries(etymonSpriteData.sprites)) {
    const sep = key.lastIndexOf(":");
    assert.ok(sep > 0, `キー形式が不正: ${key}`);
    const lineId = key.slice(0, sep);
    const stage = Number(key.slice(sep + 1));
    assert.ok(typeof path === "string" && path.length > 0, `パスが空: ${key}`);
    // ツール側はvocab-app未実装のキャラ(UMA等)も送りうるため、系統が実在する
    // 場合のみ段階の範囲を検証する(未知のlineIdは単に無視される)
    const line = LINE_BY_ID.get(lineId);
    if (line && Number.isInteger(stage)) {
      assert.ok(
        stage >= 0 && stage < line.species.length,
        `${lineId} の段階 ${stage} は範囲外(全${line.species.length}段階)`
      );
    }
  }
});

test("getEtymonSpriteOverride は未登録の系統・段階で null を返す", () => {
  assert.equal(getEtymonSpriteOverride("does-not-exist", 0), null);
  assert.equal(getEtymonSpriteOverride("bulbasaur", 99), null);
});

test("登録済みスプライトはMONSTER_LINESに反映され、元画像がfallbackに残る", () => {
  for (const [key, path] of Object.entries(etymonSpriteData.sprites)) {
    const sep = key.lastIndexOf(":");
    const line = LINE_BY_ID.get(key.slice(0, sep));
    const stage = Number(key.slice(sep + 1));
    if (!line || !Number.isInteger(stage) || stage < 0 || stage >= line.species.length) continue;
    const sp = line.species[stage];
    assert.equal(sp.sprite, path);
    assert.ok(
      sp.fallbackSprite.includes("PokeAPI") || sp.fallbackSprite.startsWith("http"),
      `${key}: 元スプライトがfallbackに残っていない`
    );
  }
});

test("未登録の系統のスプライトは従来どおり(全滅していない)", () => {
  const overridden = new Set(
    Object.keys(etymonSpriteData.sprites).map((k) => k.slice(0, k.lastIndexOf(":")))
  );
  for (const line of MONSTER_LINES) {
    if (overridden.has(line.id)) continue;
    for (const sp of line.species) {
      assert.ok(
        sp.sprite.startsWith("https://raw.githubusercontent.com/PokeAPI/"),
        `${line.id} のスプライトが意図せず変更されている: ${sp.sprite}`
      );
    }
  }
});
