import { QUESTIONS as basic } from "./basic";
import { QUESTIONS as advanced } from "./advanced";
import { DIFFICULTY_ORDER } from "./difficultyOrder";
import { LEGACY_WORD_ID_ORDER } from "./legacyWordIds";
import { parseLegacyWordId, toWordId } from "./wordId";
import { VocabItem } from "../types";

export const QUESTIONS: Omit<VocabItem, "id">[] = [...basic, ...advanced];

/** 出題される全単語。ID は配列順ではなく target + 品詞から決まる */
export const VOCAB_ITEMS: VocabItem[] = QUESTIONS.map((q) => ({
  ...q,
  id: toWordId(q.target, q.partOfSpeech),
}));

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
