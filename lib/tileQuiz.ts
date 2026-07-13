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
// ダミー漢字が足りない場合の補填用（常用漢字から抜粋、重複なし）
const FALLBACK_KANJI = [
  ..."日一国人年大十二本中長出三時行見月分後前生五間上東四今金九入学高円子外八六下来気小七山話女北午百川校木聞道場員立開手力男動",
];

// 文字盤は2行×4列で描画される（TileAnswerBoard参照）。各行の左半分に
// ひらがな等、右半分に漢字を固定配置し、正解を知っていても文字種を
// 探し回るだけのストレスを減らす（左右どちらにも正答は来るのでヒントにはならない）。
// このレイアウトは厳格なルールとして扱う: 漢字は必ず右半分、それ以外
// （ひらがな・カタカナ・記号等）は必ず左半分に入れる。片方の候補が
// 足りない場合でも反対側の文字種で穴埋めしてはならない（buildAnswerRounds
// 側でスロット数ぶんの文字を文字種ごとに確保してから渡すこと）。
const ROW_SIZE = 4;
const KANJI_PATTERN = /[㐀-䶿一-鿿]/;

function isKanji(char: string): boolean {
  return KANJI_PATTERN.test(char);
}

function splitIndicesByColumn(total: number): { leftIndices: number[]; rightIndices: number[] } {
  const leftIndices: number[] = [];
  const rightIndices: number[] = [];
  for (let i = 0; i < total; i++) {
    (i % ROW_SIZE < ROW_SIZE / 2 ? leftIndices : rightIndices).push(i);
  }
  return { leftIndices, rightIndices };
}

function arrangeByScript(tiles: AnswerTile[], rng: () => number): AnswerTile[] {
  const kanjiTiles = shuffleInPlace(tiles.filter((t) => isKanji(t.char)), rng);
  const otherTiles = shuffleInPlace(tiles.filter((t) => !isKanji(t.char)), rng);

  const { leftIndices, rightIndices } = splitIndicesByColumn(tiles.length);
  if (otherTiles.length !== leftIndices.length || kanjiTiles.length !== rightIndices.length) {
    throw new Error(
      `tileQuiz: 文字種の内訳が左右の枠数と一致しない（漢字=${kanjiTiles.length}/枠=${rightIndices.length}, その他=${otherTiles.length}/枠=${leftIndices.length}）。右=漢字・左=それ以外のルールを厳格化するため、buildAnswerRounds 側で文字種ごとの必要数を満たしてから渡すこと。`,
    );
  }

  const positions: AnswerTile[] = new Array(tiles.length);
  leftIndices.forEach((idx, i) => (positions[idx] = otherTiles[i]));
  rightIndices.forEach((idx, i) => (positions[idx] = kanjiTiles[i]));

  return positions;
}

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

  const { leftIndices, rightIndices } = splitIndicesByColumn(optionsPerRound);

  const rounds: AnswerTile[][] = answerChars.map((correct, i) => {
    // その回の正答文字と重複しないダミーを、右=漢字／左=それ以外の
    // 必要枠数ぴったりに文字種ごと集める（漢字とそれ以外を混ぜて後から
    // 帳尻合わせすると、左右のルールが崩れるため）
    const correctIsKanji = isKanji(correct);
    const kanjiNeeded = rightIndices.length - (correctIsKanji ? 1 : 0);
    const otherNeeded = leftIndices.length - (correctIsKanji ? 0 : 1);

    const used = new Set<string>([correct]);
    const kanjiDecoys: string[] = [];
    const otherDecoys: string[] = [];
    const decoysFilled = () => kanjiDecoys.length >= kanjiNeeded && otherDecoys.length >= otherNeeded;
    const pushDecoy = (char: string) => {
      if (used.has(char) || /\s/.test(char)) return;
      if (isKanji(char)) {
        if (kanjiDecoys.length >= kanjiNeeded) return;
        kanjiDecoys.push(char);
      } else {
        if (otherDecoys.length >= otherNeeded) return;
        otherDecoys.push(char);
      }
      used.add(char);
    };

    // 1) プールの他単語の文字から
    for (const char of shuffleInPlace([...candidatePool], rng)) {
      if (decoysFilled()) break;
      pushDecoy(char);
    }
    // 2) 足りなければ正答の他の文字から
    if (!decoysFilled()) {
      for (const char of shuffleInPlace([...answerChars], rng)) {
        if (decoysFilled()) break;
        pushDecoy(char);
      }
    }
    // 3) それでも漢字が足りなければ常用漢字で、それ以外はかなで埋める
    if (kanjiDecoys.length < kanjiNeeded) {
      for (const char of shuffleInPlace([...FALLBACK_KANJI], rng)) {
        if (kanjiDecoys.length >= kanjiNeeded) break;
        pushDecoy(char);
      }
    }
    if (otherDecoys.length < otherNeeded) {
      for (const char of shuffleInPlace([...FALLBACK_KANA], rng)) {
        if (otherDecoys.length >= otherNeeded) break;
        pushDecoy(char);
      }
    }

    const chars = [correct, ...kanjiDecoys, ...otherDecoys];
    return arrangeByScript(
      chars.map((char, j) => ({ id: `r${i}-${j}`, char })),
      rng,
    );
  });

  return { answer, answerChars, rounds };
}
