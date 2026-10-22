import { QUESTIONS as basic } from "./basic";
import { QUESTIONS as advanced } from "./advanced";
import { QUESTIONS as staples } from "./staples";
import { COLLOCATIONS } from "./collocations";
import { CONTEXT_PHRASES } from "./contextPhrases";
import { CONFUSABLES, Confusable } from "./confusables";
import { DIFFICULTY_ORDER } from "./difficultyOrder";
import { LEGACY_WORD_ID_ORDER } from "./legacyWordIds";
import { parseLegacyWordId, toWordId } from "./wordId";
import { VocabItem } from "../types";

/**
 * 補充語（staples）は末尾に連結する。配列の添字は出題順には使わない
 * （出題順は DIFFICULTY_ORDER が決める）ので、どこに連結しても出題には影響しない。
 */
export const QUESTIONS: Omit<VocabItem, "id">[] = [...basic, ...advanced, ...staples];

/**
 * 出題される全単語。ID は配列順ではなく target + 品詞から決まる。
 *
 * 句動詞のコロケーションはIDを決めたあとに付ける。目的語をIDの材料にすると
 * `take in` に目的語を足した時点でIDが変わり、既存ユーザーの正誤統計が
 * その語から切り離されてしまう。
 */
export const VOCAB_ITEMS: VocabItem[] = QUESTIONS.map((q) => {
  const id = toWordId(q.target, q.partOfSpeech);
  const collocation = COLLOCATIONS[id];
  if (collocation) return { ...q, id, collocation };
  const context = CONTEXT_PHRASES[id];
  return context ? { ...q, id, context } : { ...q, id };
});

export const VOCAB_IDS: string[] = VOCAB_ITEMS.map((item) => item.id);

const INDEX_BY_ID = new Map(VOCAB_IDS.map((id, i) => [id, i]));

/** 安定IDから現行の出題配列の位置を引く。未知のIDは null */
export function wordIndexOf(id: string): number | null {
  return INDEX_BY_ID.get(id) ?? null;
}

/**
 * 出題順（易しい順）に並べた VOCAB_ITEMS の添字。
 *
 * 語彙データの配列順には難易度の根拠が無いため、段階的アンロックは
 * この序列に沿って進める。序列の作り方は scripts/gen-difficulty-order.mjs
 * を参照（CEFRレベルと頻度順位の合成）。
 *
 * 序列表に無いID（語彙を追加して再生成し忘れた場合）は末尾へ回すので、
 * 再生成し忘れても出題対象から消えることはない。
 */
export const DIFFICULTY_ORDERED_INDICES: number[] = (() => {
  const ordered: number[] = [];
  const placed = new Set<number>();

  for (const id of DIFFICULTY_ORDER) {
    const index = INDEX_BY_ID.get(id);
    if (index === undefined || placed.has(index)) continue;
    placed.add(index);
    ordered.push(index);
  }
  for (let i = 0; i < VOCAB_ITEMS.length; i += 1) {
    if (!placed.has(i)) ordered.push(i);
  }

  return ordered;
})();

/**
 * 保存済みのIDを現行の安定IDへ解決する。
 *
 * - 安定ID: そのまま返す（現行の語彙に存在する場合のみ）
 * - 旧ID `w${i}`: 凍結スナップショット経由で解決する
 * - 現行の語彙から消えた単語・解釈できないID: null
 */
export function resolveWordId(rawId: string): string | null {
  if (INDEX_BY_ID.has(rawId)) return rawId;

  const legacyIndex = parseLegacyWordId(rawId);
  if (legacyIndex === null) return null;

  const migrated = LEGACY_WORD_ID_ORDER[legacyIndex];
  return migrated !== undefined && INDEX_BY_ID.has(migrated) ? migrated : null;
}

export { toWordId } from "./wordId";
export { COLLOCATIONS } from "./collocations";
export { CONTEXT_PHRASES } from "./contextPhrases";

const INDEX_BY_TARGET = new Map<string, number>();
VOCAB_ITEMS.forEach((item, i) => {
  if (!INDEX_BY_TARGET.has(item.target)) INDEX_BY_TARGET.set(item.target, i);
});

/**
 * 逆向きの紛らわしい語。CONFUSABLES の相手が収録語にあり、相手側に
 * 自前の記載が無ければ、元の語とその代表的な訳を相手側へ添える
 * （evaluate → evacuate を書けば evacuate → evaluate も出る）。
 */
const REVERSE_CONFUSABLES: Map<string, Confusable> = (() => {
  const reverse = new Map<string, Confusable>();
  for (const [id, confusable] of Object.entries(CONFUSABLES)) {
    const source = INDEX_BY_ID.get(id);
    const partner = INDEX_BY_TARGET.get(confusable.word);
    if (source === undefined || partner === undefined) continue;
    const partnerId = VOCAB_ITEMS[partner].id;
    if (CONFUSABLES[partnerId] || reverse.has(partnerId)) continue;
    const { target, answers } = VOCAB_ITEMS[source];
    reverse.set(partnerId, {
      word: target,
      // 「を描写する」「に捧げる」のような目的語の助詞は、語だけを並べる
      // この場では読みにくいので落とす
      meaning: (answers[0] ?? "").replace(/^[をに]/, ""),
      relation: confusable.relation,
    });
  }
  return reverse;
})();

/** その語の紛らわしい語（lib/vocab/confusables.ts）。無ければ null */
export function getConfusable(id: string): Confusable | null {
  return CONFUSABLES[id] ?? REVERSE_CONFUSABLES.get(id) ?? null;
}

export type { Confusable } from "./confusables";
