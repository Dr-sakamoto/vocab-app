import assert from "node:assert/strict";
import test from "node:test";

import { HABITATS } from "../lib/capture.js";
import { getHabitatSprite } from "../lib/habitatSprites.js";
import habitatSpriteData from "../lib/habitatSprites.json" with { type: "json" };

test("habitatSprites.json のエリアIDは実在する HABITATS と一致する", () => {
  const habitatIds = new Set(HABITATS.map((habitat) => habitat.id));
  for (const area of habitatSpriteData.areas) {
    assert.ok(
      habitatIds.has(area.id),
      `未知のエリアID: ${area.id}（HABITATS に存在しない）`
    );
  }
});

test("全 HABITATS がスプライト正本に登録されている", () => {
  const spriteIds = new Set(habitatSpriteData.areas.map((area) => area.id));
  for (const habitat of HABITATS) {
    assert.ok(
      spriteIds.has(habitat.id),
      `${habitat.id} が habitatSprites.json に未登録`
    );
  }
});

test("getHabitatSprite は未設定・未知IDで null を返す", () => {
  assert.equal(getHabitatSprite(null), null);
  assert.equal(getHabitatSprite(undefined), null);
  assert.equal(getHabitatSprite(""), null);
  assert.equal(getHabitatSprite("does-not-exist"), null);
  // 既定ではどのエリアも sprite 未設定なので null
  for (const area of habitatSpriteData.areas) {
    if (!area.sprite) {
      assert.equal(
        getHabitatSprite(area.id),
        null,
        `${area.id} は sprite 未設定なので null のはず`
      );
    }
  }
});

test("getHabitatSprite は設定済みスプライトを返す（フォールバック付き）", () => {
  // 設定済みエリアがあれば sprite を返し、任意で fallbackSprite を伴う
  for (const area of habitatSpriteData.areas) {
    if (area.sprite) {
      const result = getHabitatSprite(area.id);
      assert.equal(result?.sprite, area.sprite);
      assert.equal(result?.fallbackSprite, area.fallbackSprite || undefined);
    }
  }
});
