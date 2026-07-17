import assert from "node:assert/strict";
import test from "node:test";

import { AREA_FLAVOR_TIPS, getMissionTip } from "../lib/tips.js";
import { HABITATS } from "../lib/capture.js";

test("2問正解するまでは同じTipsを表示し続ける", () => {
  const first = getMissionTip(null, 0);
  assert.equal(getMissionTip(null, 1), first);
  assert.notEqual(getMissionTip(null, 2), undefined);
});

test("2問正解するとTipsが切り替わる", () => {
  const before = getMissionTip(null, 0);
  const after = getMissionTip(null, 2);
  assert.notEqual(before, after);
});

test("エリア未指定でも一般Tipsが返る", () => {
  const tip = getMissionTip(null, 0);
  assert.equal(typeof tip, "string");
  assert.ok(tip.length > 0);
});

test("エリア指定時はそのエリアのフレーバーテキストも表示され得る", () => {
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) {
    seen.add(getMissionTip("elmuria", i * 2));
  }
  assert.ok(
    seen.has("エルムリアは、北の滝の水に育まれた古く広大な森。"),
  );
});

test("エリアフレーバーには学習・勉強を連想させる語や未実装の固有伝承を含めない", () => {
  const bannedWords = ["勉強", "単語", "覚え", "暗記", "エテルナ7世", "王国"];
  for (const [habitatId, tips] of Object.entries(AREA_FLAVOR_TIPS)) {
    for (const tip of tips) {
      for (const word of bannedWords) {
        assert.ok(
          !tip.includes(word),
          `habitat ${habitatId} tip "${tip}" が禁止語 "${word}" を含んでいる`,
        );
      }
    }
  }
});

test("HABITATS の全生息地にエリアフレーバーが用意されている", () => {
  for (const habitat of HABITATS) {
    assert.ok(
      Array.isArray(AREA_FLAVOR_TIPS[habitat.id]) &&
        AREA_FLAVOR_TIPS[habitat.id].length > 0,
      `habitat ${habitat.id} にエリアフレーバーがない`,
    );
  }
});

test("未知のエリアIDでもクラッシュせず一般Tipsにフォールバックする", () => {
  assert.doesNotThrow(() => getMissionTip("no-such-area", 4));
});

test("HABITATS の全生息地IDに対してTipsが取得できる", () => {
  for (const habitat of HABITATS) {
    const tip = getMissionTip(habitat.id, 0);
    assert.ok(typeof tip === "string" && tip.length > 0, `habitat ${habitat.id}`);
  }
});

test("負の値やNaNでも安全に動作する", () => {
  assert.doesNotThrow(() => getMissionTip(null, -5));
  assert.doesNotThrow(() => getMissionTip(null, NaN));
});
