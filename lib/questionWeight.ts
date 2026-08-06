import { WordStat } from "./types";

/**
 * `weakness` の頭打ち。正解ゼロで落とし続けた語は weakness が青天井に伸びるため、
 * 上限を置かないと1語がプール全体の抽選を食い潰す。3 は「正解1回につき誤答3回」
 * 相当で、ここまで来ればもう十分に最優先で出ている。
 */
const WEAKNESS_CAP = 3;

/**
 * 出題の重み。値が大きいほど選ばれやすい（weightedPickIndex に渡す）。
 *
 * 設計の要点は「誤答を回数ではなく率で効かせる」こと。
 * 以前は誤答があるだけで `2.2` の定数下駄が乗り、その下駄は後から何回正解しても
 * 一切減らなかった。結果、20回正解しても昔の誤答1回のせいで重みが 3.34 に貼り付き、
 * 無失点の語（0.45）の 7.4 倍のまま出続けていた。克服済みの語が新出語や
 * 本当の苦手語を押しのけるので、下駄をやめて weakness 連動に寄せている。
 *
 * これにより「落としたばかりの語は強く出る」は保ったまま、正解を重ねるほど
 * 出現が引いていく（＝正解で誤答を返済できる）。
 *   (正解, 誤答) = (0,1) → 7.55 / (3,1) → 2.05 / (10,1) → 0.90 / (10,0) → 0.45
 */
export function getQuestionWeight(
  stat: WordStat | undefined,
  currentAccuracy: number,
): number {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  if (correct + wrong === 0) {
    // 未出題。調子が悪いセッションでは新出語を混ぜず、既習の立て直しに寄せる
    return currentAccuracy < 0.65 ? 0.25 : 1.8;
  }

  const weakness = Math.min(wrong / (correct + 1), WEAKNESS_CAP);

  // 定着済みの語は出現を抑える。誤答歴のある語でも、正解を十分積んで
  // weakness が下がっていれば同じように引かせる（誤答歴での永久固定を避ける）。
  const confidenceBoost =
    wrong === 0
      ? correct >= 2
        ? 0.45
        : 0.7
      : correct >= 3
        ? 0.45 + Math.min(1, weakness * 3) * 0.55
        : 1;

  const recoveryBoost = wrong > 0 ? weakness * 5.5 : 0;
  const stillLearning = Math.max(0, 3 - correct) * 0.35;

  return (1 + recoveryBoost + stillLearning) * confidenceBoost;
}
