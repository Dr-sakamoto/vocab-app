import { createSeededRng } from "./capture";
import { VocabItem } from "./types";

/**
 * スマホ向け・文字盤（タイル）回答の盤面生成。
 *
 * 「みんはや」式: 正答の文字を1文字ずつばらしてダミー文字と混ぜ、
 * プレイヤーは1文字ずつタップして答えを組み立てる。ソフトウェア
 * キーボードを一切出さずに「書く」感覚を保てるので、再生（想起）の
 * 学習効果をタイピングに近いまま維持できる。
 *
 * ダミー文字は解放済みプールの他の単語の訳から取り、雰囲気の近い
 * 文字（漢字・かな）が並ぶようにする。
 */

export interface AnswerTile {
  id: string;
  char: string;
}

export interface AnswerTileBoard {
  /** 正答（answers[0]） */
  answer: string;
  /** スロット数 = 正答の文字数（コードポイント単位） */
  answerChars: string[];
  /** シャッフル済みタイル。正答の全文字＋ダミーを含む */
  tiles: AnswerTile[];
}

export interface BuildAnswerTileBoardParams {
  items: VocabItem[];
  /** 出題中の単語のインデックス */
  index: number;
  unlockedPoolSize: number;
  /** 同じ問題では同じ盤面になるよう、問題ごとに固定のシードを渡す */
  seed: string;
  /** タイル総数の上限（正答が長い場合は正答文字数まで拡張される） */
  maxTiles?: number;
  /** ダミー文字の最低数（盤面が answer そのままにならないように） */
  minDecoys?: number;
}

function shuffleInPlace<T>(list: T[], rng: () => number): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function buildAnswerTileBoard({
  items,
  index,
  unlockedPoolSize,
  seed,
  maxTiles = 14,
  minDecoys = 4,
}: BuildAnswerTileBoardParams): AnswerTileBoard | null {
  const q = items[index];
  const answer = q?.answers?.[0]?.trim();
  if (!answer) return null;

  const answerChars = [...answer];
  const rng = createSeededRng(seed);
  const poolLimit = Math.max(1, Math.min(unlockedPoolSize, items.length));

  // ダミー文字の候補: 解放済みプールの他の単語の訳の文字
  const candidates: string[] = [];
  for (let i = 0; i < poolLimit; i++) {
    if (i === index) continue;
    const text = items[i]?.answers?.[0];
    if (!text) continue;
    for (const char of text) {
      if (/\s/.test(char)) continue;
      candidates.push(char);
    }
  }
  shuffleInPlace(candidates, rng);

  const tileCount = Math.max(
    answerChars.length,
    Math.min(maxTiles, answerChars.length + Math.max(minDecoys, 0)),
  );
  const decoyCount = tileCount - answerChars.length;
  const decoys = candidates.slice(0, decoyCount);
  // プールが小さく候補が足りないときは、正答の文字を重複させて埋める
  for (let i = decoys.length; i < decoyCount; i++) {
    decoys.push(answerChars[Math.floor(rng() * answerChars.length)]);
  }

  const tiles = shuffleInPlace(
    [...answerChars, ...decoys].map((char, i) => ({ id: `tile-${i}`, char })),
    rng,
  );

  return { answer, answerChars, tiles };
}
