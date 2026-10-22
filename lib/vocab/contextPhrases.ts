/**
 * 句動詞以外の多義語の「意味を固定する短い連語」。
 *
 * `novel` は単体では「新しい」なのか「小説」なのか、`decline` は「減少」なのか
 * 「断る」なのか決まらない。登録済みの訳語（answers）の語義に合う連語を
 * 後ろに添えると意味が一つにピン留めされ、英検の短文空所補充と同じく
 * 文の中で意味を取る練習にもなる。AI判定にもこの連語を渡し、その文脈での
 * 語義で採点させる（lib/aiReview.ts の buildReviewPrompt）。
 *
 * 句動詞の目的語（lib/vocab/collocations.ts）とは別に持つ。あちらは
 * 「動詞＋不変化詞の語だけ」という約束で運用しているため。
 * 表示・読み上げ・AI判定では、目的語があればそちら、無ければこちらを使う
 * （lib/vocab/phrase.ts の getPromptPhrase）。
 *
 * 【書くときの約束】
 * - その語の answers に登録済みの語義に合わせる（表示した連語と、正解として
 *   受理される訳がズレると学習の邪魔になる）
 * - 表示は `${target} [${値}]` なので、target の後ろに自然に続く語だけを書く
 * - 4語以内・英字と空白だけ
 * - キーは lib/vocab/wordId.ts の安定ID。target に混ぜないこと
 */
export const CONTEXT_PHRASES: Readonly<Record<string, string>> = {
  "abundant:adjective": "resources",
  "acquire:verb": "new skills",
  "address:verb": "the issue",
  "alleged:adjective": "murderer",
  "arbitrary:adjective": "decision",
  "bore:verb": "the audience",
  "breed:verb": "cattle",
  "capacity:noun": "of the tank",
  "committed:adjective": "to the cause",
  "compelling:adjective": "evidence",
  "consistent:adjective": "with the data",
  "curb:verb": "inflation",
  "decline:noun": "in sales",
  "deliberate:adjective": "attempt",
  "deliver:verb": "a speech",
  "devote:verb": "her life",
  "flash:noun": "of lightning",
  "foster:verb": "innovation",
  "gross:adjective": "income",
  "harsh:adjective": "criticism",
  "highlight:verb": "the importance",
  "invoke:verb": "martial law",
  "maintain:verb": "good health",
  "noble:adjective": "cause",
  "novel:adjective": "approach",
  "organ:noun": "donation",
  "outstanding:adjective": "performance",
  "pity:noun": "for the victims",
  "promote:verb": "economic growth",
  "pursue:verb": "a career",
  "revise:verb": "the plan",
  "sanctions:noun": "against the regime",
  "seek:verb": "advice",
  "shallow:adjective": "water",
  "striking:adjective": "contrast",
  "substantial:adjective": "amount",
  "tame:verb": "wild horses",
  "tender:adjective": "care",
  "vague:adjective": "memory",
  "vast:adjective": "desert",
  "weave:verb": "cloth",
};
