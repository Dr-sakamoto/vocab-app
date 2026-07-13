import { createSeededRng } from "./capture";
import { VocabItem } from "./types";

/**
 * スマホ向け・文字盤（タイル）回答の「ラウンド」生成。
 *
 * 「みんはや」式: 正答を1文字ずつ組み立てる。ただし全文字を一度に並べる
 * のではなく、1文字選ぶごとに選択肢を入れ替える。各ラウンドは
 * 「正答の次の1文字＋ダミー(N-1)個」の計N択で、正答の文字数ぶん繰り返す
 * （例: 4文字なら 8択×4回）。総文字数（残りスロット数）は伏せる。
 * PC(タイピング)とスマホ(文字盤)で難易度が変わるのは許容する。
 */

const OPTIONS_PER_ROUND = 8;
const FALLBACK_KANA = [..."あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"];

export interface AnswerTile {
  id: string;
  char: string;
}

export interface AnswerRoundsBoard {
  /** 正答（answers[0]） */
  answer: string;
  /** 正答を1文字ずつ分解したもの（内部判定用。UIには文字数を出さない） */
  answerChars: string[];
  /** ラウンドごとの選択肢。rounds[i] は位置 i の N択（正答の文字を1つ含む） */
  rounds: AnswerTile[][];
}

export interface BuildAnswerRoundsParams {
  items: VocabItem[];
  /** 出題中の単語のインデックス */
  index: number;
  unlockedPoolSize: number;
  /** 同じ問題では同じ盤面になるよう、問題ごとに固定のシードを渡す */
  seed: string;
  /** 1ラウンドの選択肢数 */
  optionsPerRound?: number;
}

function shuffleInPlace<T>(list: T[], rng: () => number): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function buildAnswerRounds({
  items,
  index,
  unlockedPoolSize,
  seed,
  optionsPerRound = OPTIONS_PER_ROUND,
}: BuildAnswerRoundsParams): AnswerRoundsBoard | null {
  const q = items[index];
  const answer = q?.answers?.[0]?.trim();
  if (!answer) return null;

  const answerChars = [...answer];
  const rng = createSeededRng(seed);
  const poolLimit = Math.max(1, Math.min(unlockedPoolSize, items.length));

  // ダミー文字の候補: 解放済みプールの他の単語の訳の文字
  const candidatePool: string[] = [];
  for (let i = 0; i < poolLimit; i++) {
    if (i === index) continue;
    const text = items[i]?.answers?.[0];
    if (!text) continue;
    for (const char of text) {
      if (/\s/.test(char)) continue;
      candidatePool.push(char);
    }
  }

  const rounds: AnswerTile[][] = answerChars.map((correct, i) => {
    // その回の正答文字と重複しないダミーを集める
    const used = new Set<string>([correct]);
    const decoys: string[] = [];
    const pushDecoy = (char: string) => {
      if (used.has(char) || /\s/.test(char)) return;
      used.add(char);
      decoys.push(char);
    };

    // 1) プールの他単語の文字から
    for (const char of shuffleInPlace([...candidatePool], rng)) {
      if (decoys.length >= optionsPerRound - 1) break;
      pushDecoy(char);
    }
    // 2) 足りなければ正答の他の文字から
    if (decoys.length < optionsPerRound - 1) {
      for (const char of shuffleInPlace([...answerChars], rng)) {
        if (decoys.length >= optionsPerRound - 1) break;
        pushDecoy(char);
      }
    }
    // 3) それでも足りなければ かな で埋める
    if (decoys.length < optionsPerRound - 1) {
      for (const char of shuffleInPlace([...FALLBACK_KANA], rng)) {
        if (decoys.length >= optionsPerRound - 1) break;
        pushDecoy(char);
      }
    }

    const chars = [correct, ...decoys];
    return shuffleInPlace(
      chars.map((char, j) => ({ id: `r${i}-${j}`, char })),
      rng,
    );
  });

  return { answer, answerChars, rounds };
}
