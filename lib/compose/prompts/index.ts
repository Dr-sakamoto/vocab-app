import type { ComposePrompt } from "../types";
import { BASIC_PROMPTS } from "./basic";
import { STANDARD_PROMPTS } from "./standard";
import { ADVANCED_PROMPTS } from "./advanced";

/**
 * 出題データの単一の入口。
 *
 * 並びは統計に影響しない（保存キーは配列の添字ではなく `prompt.id`）。
 * 単語アプリでは添字を保存キーにしたために、語を1つ挿入するだけで
 * それ以降の統計が別の語へずれた。同じ失敗をしないよう、こちらは
 * 最初からIDで引く。
 */
export const COMPOSE_PROMPTS: ComposePrompt[] = [
  ...BASIC_PROMPTS,
  ...STANDARD_PROMPTS,
  ...ADVANCED_PROMPTS,
];

const PROMPT_BY_ID = new Map<string, ComposePrompt>(
  COMPOSE_PROMPTS.map((prompt) => [prompt.id, prompt]),
);

export function findPrompt(id: string): ComposePrompt | null {
  return PROMPT_BY_ID.get(id) ?? null;
}

/** そのタグを試している問題（弱点特訓の母集団） */
export function promptsWithTag(tagId: string): ComposePrompt[] {
  return COMPOSE_PROMPTS.filter((prompt) => prompt.tags.includes(tagId as never));
}

export { BASIC_PROMPTS, STANDARD_PROMPTS, ADVANCED_PROMPTS };
