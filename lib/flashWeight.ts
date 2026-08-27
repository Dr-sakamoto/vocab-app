import { WordStat } from "./types";
import { weightedPickIndex } from "./weightedPick";
import { FLASH } from "./constants";

function getFlashWeight(stat: WordStat | undefined): number {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  const attempts = correct + wrong;
  if (attempts === 0) return 4; // 未挑戦は最優先で見せる
  if (wrong === 0) return correct >= 2 ? 0.3 : 0.8; // 定着済み／直近正解は出現を抑える
  return 1.2; // 学習中
}

/**
 * 苦手語の「卒業」ライン。誤答1回につきこの回数だけ正解を積み上げていれば、
 * 累計の誤答回数がいくつであってももう苦手語とはみなさない。
 */
const RECOVERY_CORRECT_PER_WRONG = 2;

/**
 * 誤答したあとに正解を積み直して定着したか。
 *
 * 統計は累計の correct/wrong しか持たない（誤答の「あと」に何があったかは
 * 記録していない）ため、正解と誤答の比で近似する。これを見ないと苦手判定が
 * 累計誤答回数だけになり、「5回落としたがその後は毎回正解している語」と
 * 「その後も落とし続けている語」が同じ扱いのまま苦手フラッシュに残り続ける。
 *
 * 累計しか持たない以上「昔たくさん正解したが最近落とし始めた語」は
 * 卒業と判定されうるが、その語は通常の出題側（getQuestionWeight）が
 * weakness で拾うため、ここでは比のシンプルさを取る。
 */
export function hasRecoveredFromMistakes(stat: WordStat | undefined): boolean {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  if (wrong === 0) return true;
  return correct >= wrong * RECOVERY_CORRECT_PER_WRONG;
}

/**
 * 「よく間違える語」かどうか。
 * threshold回数以上間違えていて、かつまだ定着し直していない語だけを苦手とみなす。
 */
export function isMistakeWord(
  stat: WordStat | undefined,
  threshold: number = FLASH.MISTAKE_THRESHOLD_DEFAULT,
): boolean {
  if ((stat?.wrong ?? 0) < threshold) return false;
  return !hasRecoveredFromMistakes(stat);
}

/** candidates のうち「よく間違える語」（threshold以上間違えて未定着）だけを抜き出す */
export function filterMistakeIndices(
  candidates: number[],
  stats: WordStat[],
  threshold: number = FLASH.MISTAKE_THRESHOLD_DEFAULT,
): number[] {
  return candidates.filter((i) => isMistakeWord(stats[i], threshold));
}

/**
 * 解放済みプール（tier）内から、未挑戦・定着未熟な単語ほど高頻度で出す重み付き抽選。
 * `candidates` は解放済みの VOCAB_ITEMS 添字（useVocabPool と同じ
 * getUnlockedIndices の結果を渡す想定）。新規の永続データは持たず、
 * 既存の correct/wrong 統計だけから重みを出す。
 *
 * `seenInLap` を渡すと、1周（lap）の中で既に出した単語は次の抽選候補から
 * 除外する（1周し切るまで同じ単語を重複させないため）。
 */
export function pickFlashIndex(
  candidates: number[],
  stats: WordStat[],
  avoidIndex: number | null,
  seenInLap?: ReadonlySet<number>,
): number | null {
  let pool = candidates;
  if (seenInLap && seenInLap.size > 0 && seenInLap.size < pool.length) {
    pool = pool.filter((i) => !seenInLap.has(i));
  }
  if (avoidIndex !== null && pool.length > 1) {
    pool = pool.filter((i) => i !== avoidIndex);
  }
  return weightedPickIndex(pool, (i) => getFlashWeight(stats[i]));
}

/** フラッシュの進行状態。1周ぶんの既出集合と周回数を持つ */
export interface FlashProgress {
  index: number;
  seen: ReadonlySet<number>;
  lap: number;
  /**
   * 1コマ進むたびに単調増加するカウンタ。
   * 候補が1語しかない場合など「次も同じ index」になる場面でも状態の変化を
   * 表現でき、これを依存に入れることで自動送りのタイマーが必ず張り直される。
   */
  step: number;
}

/** フラッシュ開始時の進行状態を作る */
export function createFlashProgress(
  candidates: number[],
  stats: WordStat[],
): FlashProgress {
  const index = pickFlashIndex(candidates, stats, null) ?? candidates[0] ?? 0;
  return { index, seen: new Set([index]), lap: 1, step: 0 };
}

/**
 * フラッシュを1コマ進める。1周し切ったら既出集合をリセットして周回数を上げる。
 * 候補が1語だけのときは同じ index を返すが、step は必ず進む。
 *
 * 既出集合がちょうど1周分埋まった回（例: 60語プールで60語目）は、リセットを
 * 1コマ遅らせてそのまま返す。ここで即リセットすると進捗表示が
 * 「59/60→1/60」のように満了表示（60/60）を一切見せずに飛んでしまうため。
 */
export function advanceFlashProgress(
  prev: FlashProgress,
  candidates: number[],
  stats: WordStat[],
): FlashProgress {
  const step = prev.step + 1;
  const prevLapComplete = candidates.length > 0 && prev.seen.size >= candidates.length;
  if (prevLapComplete) {
    const nextIndex = pickFlashIndex(candidates, stats, prev.index) ?? prev.index;
    return { index: nextIndex, seen: new Set([nextIndex]), lap: prev.lap + 1, step };
  }
  const nextIndex = pickFlashIndex(candidates, stats, prev.index, prev.seen) ?? prev.index;
  const seen = prev.seen.has(nextIndex)
    ? prev.seen
    : new Set(prev.seen).add(nextIndex);
  return { index: nextIndex, seen, lap: prev.lap, step };
}

/** localStorage に保存する形（Set は配列にする）。どちらのモードで保存したかも持つ */
export interface StoredFlashProgress {
  index: number;
  seen: number[];
  lap: number;
  mistakeOnly: boolean;
}

export function toStoredFlashProgress(
  progress: FlashProgress,
  mistakeOnly: boolean,
): StoredFlashProgress {
  return { index: progress.index, seen: Array.from(progress.seen), lap: progress.lap, mistakeOnly };
}

/**
 * 保存済みの進行状態を復元する。モードが違う・出題対象がその index を
 * もう含まない（プール変化や苦手語卒業）場合は復元せず null を返す。
 */
export function fromStoredFlashProgress(
  stored: StoredFlashProgress | null,
  candidates: number[],
  mistakeOnly: boolean,
): FlashProgress | null {
  if (!stored || stored.mistakeOnly !== mistakeOnly) return null;
  if (!candidates.includes(stored.index)) return null;
  const seen = new Set(stored.seen.filter((i) => candidates.includes(i)));
  seen.add(stored.index);
  return { index: stored.index, seen, lap: Math.max(1, stored.lap), step: 0 };
}
