import { QUESTIONS as basic } from "./basic";
import { QUESTIONS as advanced } from "./advanced";
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
