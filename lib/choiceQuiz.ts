import { createSeededRng } from "./capture";
import { VocabItem } from "./types";

/**
 * スマホ向け・選択式回答の選択肢生成。
 *
 * ソフトウェアキーボードはフロー状態を切る最大の要因なので、
 * スマホでは日本語訳をタイピングさせず4択から選ばせる。
 * 誤答選択肢（ダミー）は解放済みプールの他の単語の訳から作り、
 * 同じ品詞を優先して「見た瞬間にわかる消去法」を防ぐ。
 */

export interface ChoiceOption {
  text: string;
  correct: boolean;
}

export interface BuildChoiceOptionsParams {
  items: VocabItem[];
  /** 出題中の単語のインデックス */
  index: number;
  unlockedPoolSize: number;
  /** 同じ問題では同じ選択肢になるよう、問題ごとに固定のシードを渡す */
  seed: string;
  optionCount?: number;
}

function shuffleInPlace<T>(list: T[], rng: () => number): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function buildChoiceOptions({
  items,
  index,
  unlockedPoolSize,
  seed,
  optionCount = 4,
}: BuildChoiceOptionsParams): ChoiceOption[] {
  const q = items[index];
  const correctText = q?.answers?.[0];
  if (!q || !correctText) return [];

  const rng = createSeededRng(seed);
  const poolLimit = Math.max(1, Math.min(unlockedPoolSize, items.length));

  // 出題単語の正答（別解含む）と重複する訳はダミーにしない
  const excluded = new Set<string>(q.answers ?? []);
  excluded.add(correctText);

  const samePos: number[] = [];
  const others: number[] = [];
  for (let i = 0; i < poolLimit; i++) {
    if (i === index) continue;
    if (items[i]?.partOfSpeech === q.partOfSpeech) samePos.push(i);
    else others.push(i);
  }

  const distractors: string[] = [];
  const used = new Set<string>(excluded);
  const takeFrom = (indices: number[]) => {
    shuffleInPlace(indices, rng);
    for (const i of indices) {
      if (distractors.length >= optionCount - 1) return;
      const text = items[i]?.answers?.[0];
      if (!text || used.has(text)) continue;
      used.add(text);
      distractors.push(text);
    }
  };
  takeFrom(samePos);
  takeFrom(others);

  const options: ChoiceOption[] = [
    { text: correctText, correct: true },
    ...distractors.map((text) => ({ text, correct: false })),
  ];
  return shuffleInPlace(options, rng);
}
