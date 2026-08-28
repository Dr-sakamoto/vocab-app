import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { evaluateUnlockGate, UNLEARNED_MAX_LEVEL } from "../lib/unlockGate.js";
import { getRetentionLevel } from "../lib/retention.js";
import { GAME } from "../lib/constants.js";

// 新しい語の解放は「1セットの正答率」ではなく「定着ドーナツの分布」で決まる。
// 10問の出来はどの語を引いたかで揺れるので、それを合図にすると
// たまたま得意な10語を当てただけでプールが広がってしまう。

/** 定着レベルごとの語数を [未出題, Lv.1, Lv.2, Lv.3, Lv.4, Lv.5] で組む */
function counts({ l0 = 0, l1 = 0, l2 = 0, l3 = 0, l4 = 0, l5 = 0 } = {}) {
  return [l0, l1, l2, l3, l4, l5];
}

test("プールが空なら解放しない（割合が定義できない）", () => {
  const gate = evaluateUnlockGate(counts());
  assert.equal(gate.poolSize, 0);
  assert.equal(gate.step, 0);
});

test("未正解が少なくても、平均Lvが届いていなければ解放しない", () => {
  // 全語が Lv.2（正解1回）で止まった状態。未正解は0%だが底上げが浅い
  const gate = evaluateUnlockGate(counts({ l2: 100 }));
  assert.equal(gate.unlearnedRatio, 0);
  assert.equal(gate.avgLevel, 2);
  assert.equal(gate.meetsUnlearnedRatio, true);

  const shallow = evaluateUnlockGate(counts({ l1: 10, l2: 90 }));
  assert.ok(shallow.avgLevel < GAME.UNLOCK_AVG_LEVEL);
  assert.equal(shallow.meetsAvgLevel, false);
  assert.equal(shallow.step, 0);
});

test("平均Lvが届いていても、未正解の語が多ければ解放しない", () => {
  // 4割を Lv.5 まで育て、6割は一度も出題していない偏った分布。
  // 平均だけ見ると条件を満たすが、これを通すと未出題の山が積み上がる。
  const gate = evaluateUnlockGate(counts({ l0: 60, l5: 40 }));
  assert.equal(gate.avgLevel, 2);
  assert.equal(gate.meetsAvgLevel, true);
  assert.equal(gate.unlearnedRatio, 0.6);
  assert.equal(gate.meetsUnlearnedRatio, false);
  assert.equal(gate.step, 0, "偏った分布で解放してはいけない");
});

test("中心と裾の両方が条件を満たしたときだけ解放する", () => {
  const gate = evaluateUnlockGate(counts({ l0: 20, l3: 40, l4: 40 }));
  assert.equal(gate.unlearnedRatio, 0.2);
  assert.equal(gate.meetsAvgLevel, true);
  assert.equal(gate.meetsUnlearnedRatio, true);
  assert.equal(gate.step, GAME.UNLOCK_STEP);
});

test("ちょうど閾値でも解放する（境界を含む）", () => {
  // 未正解ちょうど 25%、平均Lv ちょうど 2.0
  const gate = evaluateUnlockGate(counts({ l0: 25, l2: 50, l4: 25 }));
  assert.equal(gate.unlearnedRatio, GAME.UNLOCK_UNLEARNED_RATIO);
  assert.equal(gate.avgLevel, GAME.UNLOCK_AVG_LEVEL);
  assert.equal(gate.step, GAME.UNLOCK_STEP);
});

test("閾値ぎりぎりで解放すると、その解放自体で条件が締まり直す", () => {
  // 解放は未出題の語を増やすので、分布は必ず希釈される。
  // これが「好調なセットごとに解放され続ける」歯止めになっている。
  const before = counts({ l0: 30, l5: 90 });
  assert.equal(evaluateUnlockGate(before).step, GAME.UNLOCK_STEP);

  const after = [...before];
  after[0] += GAME.UNLOCK_STEP;
  assert.equal(
    evaluateUnlockGate(after).step,
    0,
    "解放直後もそのまま解放が続くと、吸収ペースを追い越してしまう",
  );
});

test("「未正解」に数える段は、正解が1回も無い語と厳密に一致する", () => {
  // UNLEARNED_MAX_LEVEL を動かすと Lv.2（正解1回）まで巻き込む。
  // 定着レベルの定義（lib/retention.ts）との対応をここで固定しておく。
  for (let correct = 0; correct <= 4; correct += 1) {
    for (let wrong = 0; wrong <= 4; wrong += 1) {
      const level = getRetentionLevel({ correct, wrong });
      assert.equal(
        level <= UNLEARNED_MAX_LEVEL,
        correct === 0,
        `correct=${correct} wrong=${wrong} の段が未正解の範囲と食い違う`,
      );
    }
  }
});

test("解放の判定にセットの正答率を使っていない", () => {
  // 「たまたま8問正解した」で解放が起きる形へ戻っていないことを構造で守る。
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("evaluateUnlockGate("), "分布による判定が呼ばれていない");
  assert.ok(
    !/UNLOCK_ACCURACY|PERFECT_UNLOCK_STEP/.test(page),
    "正答率で解放量を決める分岐が残っている",
  );
});
