import assert from "node:assert/strict";
import test from "node:test";

import { getQuestionWeight } from "../lib/questionWeight.js";

const w = (correct, wrong, accuracy = 1.0) =>
  getQuestionWeight({ correct, wrong }, accuracy);

test("未出題は好調なら出しやすく、不調なら抑える", () => {
  assert.equal(w(0, 0, 1.0), 1.8);
  assert.equal(w(0, 0, 0.5), 0.25);
  // stat 未定義でも未出題として扱う
  assert.equal(getQuestionWeight(undefined, 1.0), 1.8);
});

test("落としたばかりの語は最優先で出る", () => {
  assert.ok(w(0, 1) > w(0, 0), "誤答直後は未出題より強く出す");
  assert.ok(w(0, 1) > 7, `落としたばかりの語の重みが弱すぎる: ${w(0, 1)}`);
});

test("無失点で定着した語がもっとも出にくい", () => {
  const mastered = w(10, 0);
  assert.equal(mastered, 0.45);
  for (const [c, x] of [[0, 0], [1, 0], [0, 1], [3, 1], [10, 1]]) {
    assert.ok(
      w(c, x) > mastered,
      `(正解${c}, 誤答${x}) が定着済みより出にくい: ${w(c, x)}`,
    );
  }
});

// 今回の修正の主眼。以前は誤答があるだけで定数 2.2 の下駄が乗り、その下駄は
// 何回正解しても減らなかったため、昔1回落としただけの語が永久に出続けていた。
test("誤答は正解を重ねることで返済できる", () => {
  const series = [0, 1, 2, 3, 5, 10, 20].map((c) => w(c, 1));
  for (let i = 1; i < series.length; i++) {
    assert.ok(
      series[i] < series[i - 1],
      `正解を重ねても重みが下がっていない: ${JSON.stringify(series)}`,
    );
  }
  // 十分に正解を積めば、無失点の語と同程度まで引っ込む
  assert.ok(
    w(20, 1) < w(0, 0),
    `克服済みの語が未出題より出やすいまま: ${w(20, 1)}`,
  );
});

test("昔の誤答1回が定着済みの語を押しのけ続けない", () => {
  const recovered = w(10, 1);
  const clean = w(10, 0);
  const share = recovered / (recovered + clean);
  assert.ok(
    share < 0.75,
    `昔1回落としただけの語が出題を占めすぎ: ${(share * 100).toFixed(1)}%`,
  );
});

test("誤答が多い語ほど強く出る", () => {
  const series = [0, 1, 2, 3].map((x) => w(2, x));
  for (let i = 1; i < series.length; i++) {
    assert.ok(
      series[i] > series[i - 1],
      `誤答を重ねても重みが上がっていない: ${JSON.stringify(series)}`,
    );
  }
});

test("weakness に頭打ちがあり1語がプールを食い潰さない", () => {
  // 正解ゼロで落とし続けても weakness は 3 で止まる
  assert.equal(w(0, 3), w(0, 10));
  assert.ok(w(0, 100) < 20, `頭打ちが効いていない: ${w(0, 100)}`);
});

test("正解を足して重みが増えることはない", () => {
  for (const x of [0, 1, 2, 3, 5]) {
    for (let c = 0; c < 20; c++) {
      assert.ok(
        w(c + 1, x) <= w(c, x) + 1e-9,
        `(正解${c}→${c + 1}, 誤答${x}) で重みが増えた: ${w(c, x)} → ${w(c + 1, x)}`,
      );
    }
  }
});

test("重みは常に正で有限", () => {
  for (let c = 0; c <= 30; c++) {
    for (let x = 0; x <= 30; x++) {
      const weight = w(c, x);
      assert.ok(
        Number.isFinite(weight) && weight > 0,
        `(正解${c}, 誤答${x}) の重みが不正: ${weight}`,
      );
    }
  }
});
