/**
 * 周回出題：収録語全体をランダムな順番で1語ずつ機械的に出す。
 *
 * 苦手に寄せた重み付き抽選（lib/questionWeight.ts）は、狭いプールの中で
 * 同じ語を何度も出し直すので、1セッションで触れる語の幅が小さく、
 * 進んでいる手応えが出にくい。そこで最初の GAME.LAP_LOCK_COUNT 周は
 * パーソナライズを止め、全語を1周ずつシャッフル順で流す。
 * 周回を終えたら従来の重み付き抽選（＋解放ゲート）へ戻る。
 *
 * 1周の順番は (seed, lap) から決定的に作るので、保存するのは
 * seed・何周目か・周内の位置の3つだけで済む（並び自体は保存しない）。
 */

export interface LapState {
  /** 並びを作る乱数の種。端末ごとに一度だけ決める */
  seed: number;
  /** 完了した周回数（0 = 1周目の途中） */
  lap: number;
  /** いまの周の何語目まで出し終えたか */
  cursor: number;
}

export function createLapState(seed: number = randomSeed()): LapState {
  return { seed, lap: 0, cursor: 0 };
}

function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

/** 保存値を検証して LapState に戻す。壊れていれば新しく始める */
export function normalizeLapState(raw: unknown): LapState {
  const value = (raw ?? {}) as Record<string, unknown>;
  const seed = Number(value.seed);
  const lap = Number(value.lap);
  const cursor = Number(value.cursor);
  if (!Number.isInteger(seed) || !Number.isInteger(lap) || !Number.isInteger(cursor)) {
    return createLapState();
  }
  return { seed, lap: Math.max(0, lap), cursor: Math.max(0, cursor) };
}

/** 周回出題の期間中か（＝苦手パーソナライズをロックしているか） */
export function isLapLocked(state: LapState, lockCount: number): boolean {
  return state.lap < lockCount;
}

/** mulberry32。周ごとの並びを再現できれば十分なので軽量なもので足りる */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** lap 周目の出題順（0〜length-1 の並べ替え）。同じ seed・lap なら毎回同じ */
export function lapOrder(length: number, seed: number, lap: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  const random = mulberry32(seed + Math.imul(lap + 1, 0x9e3779b1));
  for (let i = length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * 次のセット（最大 size 語）を周回順から取り出す。
 *
 * 返す next は「このセットを解き終えたら」の状態。呼び出し側はセットの
 * 締めで初めて next を確定させる。途中で閉じた（リロードした）セットは
 * 同じ10語がもう一度出るだけで、周の中で語を取りこぼさない。
 *
 * 周の切れ目をまたぐセットは次の周の先頭から補う。そのとき同じセットに
 * 同じ語が二度入らないよう、すでに入っている語は飛ばす（飛ばした語は
 * 直前の周の末尾で出たばかりなので、その周では出したものとして扱う）。
 * 収録語数が変わると並びが変わるが、周の途中で数語ずれる程度で済む。
 */
export function pickLapSet(
  state: LapState,
  length: number,
  size: number,
): { indices: number[]; next: LapState } {
  if (length <= 0 || size <= 0) return { indices: [], next: state };

  const indices: number[] = [];
  const inSet = new Set<number>();
  let { lap, cursor } = state;
  if (cursor >= length) {
    lap += 1;
    cursor = 0;
  }
  let order = lapOrder(length, state.seed, lap);
  const limit = Math.min(size, length);

  while (indices.length < limit) {
    const index = order[cursor];
    cursor += 1;
    if (!inSet.has(index)) {
      inSet.add(index);
      indices.push(index);
    }
    if (cursor >= length) {
      lap += 1;
      cursor = 0;
      order = lapOrder(length, state.seed, lap);
    }
  }

  return { indices, next: { seed: state.seed, lap, cursor } };
}
