import { VocabItem } from "../types";

/**
 * 単語に添える短い英語。句動詞の目的語（collocation）があればそちら、
 * 無ければ多義語の意味を固定する連語（context）。表示・読み上げ・
 * AI判定のどれもこの1か所から引くので、見せたものと採点の文脈がズレない。
 */
export function getPromptPhrase(
  item: Pick<VocabItem, "collocation" | "context">,
): string | undefined {
  return item.collocation ?? item.context;
}
