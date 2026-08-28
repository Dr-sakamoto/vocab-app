import { GAME } from "./constants";

/**
 * 「まだ一度も正解していない語」に当たる定着レベルの上限。
 *
 * getRetentionLevel（lib/retention.ts）は correct === 0 の語だけを
 * 0（未出題）と 1（出題済みだが未正解）へ割り当てている。つまり
 * この2段の合計が「正解が1回も無い語」と厳密に一致する。
 * ここを 2 へ広げると Lv.2（正解1回）まで含んでしまい、意味が変わる。
 */
export const UNLEARNED_MAX_LEVEL = 1;

export interface UnlockGate {
  /** 判定に使ったプールの語数（levelCounts の合計） */
  poolSize: number;
  /** プールの平均定着レベル（0〜5）。定着ドーナツ中央の「平均Lv」と同じ値 */
  avgLevel: number;
  /** まだ一度も正解していない語（未出題＋Lv.1）がプールに占める割合（0〜1） */
  unlearnedRatio: number;
  /** 平均Lvの条件を満たしているか */
  meetsAvgLevel: boolean;
  /** 未正解の割合の条件を満たしているか */
  meetsUnlearnedRatio: boolean;
  /** 解放する語数。0 なら解放しない */
  step: number;
}

/**
 * 定着ドーナツの分布から、新しい語を解放してよいかを判定する。
 *
 * 入力は画面に出ている内訳そのもの（countRetentionLevels の戻り値）なので、
 * 「解放の条件」と「ドーナツが見せているもの」が定義からしてズレない。
 * 1セットの正答率は見ない——なぜこの基準にしたかは GAME の
 * UNLOCK_AVG_LEVEL / UNLOCK_UNLEARNED_RATIO のコメントを参照。
 *
 * 純関数なので、解放の実行時（そのセットを畳み込んだ後の統計）と
 * 結果画面の「次の解放まで」表示の両方から同じ式で呼べる。
 */
export function evaluateUnlockGate(levelCounts: number[]): UnlockGate {
  const poolSize = levelCounts.reduce((sum, count) => sum + count, 0);

  // プールが空（＝語彙データが無い）のときは、割合が定義できないので
  // 「まだ何も満たしていない」として解放しない。
  if (poolSize <= 0) {
    return {
      poolSize: 0,
      avgLevel: 0,
      unlearnedRatio: 1,
      meetsAvgLevel: false,
      meetsUnlearnedRatio: false,
      step: 0,
    };
  }

  const levelSum = levelCounts.reduce((sum, count, level) => sum + count * level, 0);
  const unlearned = levelCounts
    .slice(0, UNLEARNED_MAX_LEVEL + 1)
    .reduce((sum, count) => sum + count, 0);

  const avgLevel = levelSum / poolSize;
  const unlearnedRatio = unlearned / poolSize;
  const meetsAvgLevel = avgLevel >= GAME.UNLOCK_AVG_LEVEL;
  const meetsUnlearnedRatio = unlearnedRatio <= GAME.UNLOCK_UNLEARNED_RATIO;

  return {
    poolSize,
    avgLevel,
    unlearnedRatio,
    meetsAvgLevel,
    meetsUnlearnedRatio,
    step: meetsAvgLevel && meetsUnlearnedRatio ? GAME.UNLOCK_STEP : 0,
  };
}
