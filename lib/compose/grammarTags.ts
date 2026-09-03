// =====================================================
// 文法・表現タグの一覧。
//
// このアプリの弱点分析はすべてこのタグを単位に集計する。出題データ
// （lib/compose/prompts）は「その1問が何を試しているか」をここのIDで宣言し、
// AI採点は「狙ったタグを使えていたか」をタグごとに返す。
//
// タグを設計するときの制約:
//   1. AIが答案から機械的に判定できる粒度にする（「表現力」のような
//      主観的な括りは、判定がぶれて弱点データが濁る）
//   2. 日本語話者が実際につまずく境界で切る（冠詞と可算/不可算は
//      同じ「名詞」でも原因が別なので分ける）
//   3. 増やしすぎない。1タグあたり十分な答案数が貯まらないと
//      習熟度の推定が当たらない（lib/compose/mastery.ts の縮小推定）
//
// IDは統計の保存キーなので、いったん公開したら変えない（単語アプリで
// 配列添字を保存キーにして統計がずれた失敗を繰り返さない）。
// =====================================================

export interface GrammarTag {
  id: string;
  /** 画面に出す短い名前 */
  label: string;
  /** 何を試しているのか。分析画面で弱点の中身を説明するのに使う */
  description: string;
  /** 書くときの指針。ヒント表示と分析画面の両方で見せる */
  hint: string;
}

export const GRAMMAR_TAGS = [
  {
    id: "tense",
    label: "時制",
    description: "現在・過去・未来のどれで書くか。習慣・予定・過去の一点の描き分け。",
    hint: "習慣は現在形、確定した予定は be going to。時・条件の副詞節では未来も現在形で書く。",
  },
  {
    id: "perfect",
    label: "完了形",
    description: "現在完了・過去完了。継続・経験・完了と、過去より前を表す形。",
    hint: "「いつ」を言わない継続・経験は have + 過去分詞。過去のある時点より前は had + 過去分詞。",
  },
  {
    id: "progressive",
    label: "進行形",
    description: "be + -ing で表す進行中の動作と、進行形にしない状態動詞の区別。",
    hint: "know / have / like などの状態動詞は進行形にしない。いま進行中の動作だけ be + -ing。",
  },
  {
    id: "articles",
    label: "冠詞",
    description: "a / an / the / 無冠詞の選択。初出か既出か、特定できるか。",
    hint: "初めて出す可算名詞の単数には a/an、相手が特定できるものには the。職業には a を付ける。",
  },
  {
    id: "countability",
    label: "名詞の数",
    description: "可算・不可算の区別と複数形。information / homework などの扱い。",
    hint: "information・homework・advice・furniture は不可算。数えるなら a piece of を使う。",
  },
  {
    id: "agreement",
    label: "主語と動詞の一致",
    description: "三単現の s、単数扱いの主語（everyone / the number of ...）との一致。",
    hint: "主語の中心になる名詞を先に決める。everyone・each・the number of は単数扱い。",
  },
  {
    id: "word-order",
    label: "語順",
    description: "疑問文・間接疑問の語順、副詞や否定語を置く位置。",
    hint: "間接疑問は〈疑問詞＋主語＋動詞〉。頻度の副詞は一般動詞の前、be動詞の後ろ。",
  },
  {
    id: "prepositions",
    label: "前置詞",
    description: "場所・時間・動詞との結びつきで決まる前置詞の選択。",
    hint: "点で捉える時刻・場所は at、面は on、範囲は in。動詞と組でおぼえる（wait for / agree with）。",
  },
  {
    id: "passive",
    label: "受動態",
    description: "be + 過去分詞。行為者を言わない文、感情を表す受動態。",
    hint: "誰がしたかを言わない・言えないときは受動態。be surprised at のように感情も受動態で表す。",
  },
  {
    id: "infinitive-gerund",
    label: "不定詞と動名詞",
    description: "to do と doing の使い分け。動詞や前置詞のあとにどちらが来るか。",
    hint: "前置詞の後ろは必ず動名詞。enjoy / finish は doing、want / decide は to do を取る。",
  },
  {
    id: "relative",
    label: "関係詞",
    description: "関係代名詞・関係副詞・what 節。名詞を後ろから説明する形。",
    hint: "説明したい名詞を先に置き、その後ろに節を続ける。「〜すること・もの」は what 節でまとめる。",
  },
  {
    id: "subordinate",
    label: "従属節",
    description: "that 節・時や条件の節・譲歩の節。文と文のつなぎ方。",
    hint: "接続詞を1つ選び、主節と従属節の主語・動詞をそれぞれ立てる。前置詞と接続詞を混同しない。",
  },
  {
    id: "modal",
    label: "助動詞",
    description: "can / must / should / may などの推量・義務・許可の度合い。",
    hint: "義務は must / have to、推量は may / must、後悔は should have + 過去分詞。",
  },
  {
    id: "conditional",
    label: "仮定法",
    description: "現実の条件（if + 現在形）と、事実に反する仮定（過去形・過去完了）の区別。",
    hint: "事実に反する現在は If + 過去形 + would、過去は If + had + 過去分詞 + would have。",
  },
  {
    id: "comparison",
    label: "比較",
    description: "比較級・最上級・as ... as。比べる対象をそろえること。",
    hint: "than / as の後ろは比べる相手と同じ形にそろえる。最上級には the を付ける。",
  },
  {
    id: "causative",
    label: "使役・知覚動詞",
    description: "make / let / have / get と、see / hear のあとに続く動詞の形。",
    hint: "make・let・have + 人 + 原形、get + 人 + to do。物を「〜してもらう」は have + 物 + 過去分詞。",
  },
  {
    id: "participle",
    label: "分詞",
    description: "名詞を後ろから修飾する分詞と、分詞構文による文の圧縮。",
    hint: "能動なら -ing、受動なら過去分詞。主語が主節と同じときだけ分詞構文にできる。",
  },
  {
    id: "formal-subject",
    label: "形式主語・there構文",
    description: "It is ... to do / It takes ... / There is ... の型。",
    hint: "「〜するのは…だ」は It is ... to do、「〜がある」は There is/are、「時間がかかる」は It takes。",
  },
  {
    id: "verb-choice",
    label: "動詞の選択",
    description: "意味の近い動詞の選び分けと、動詞に付く前置詞の有無。",
    hint: "日本語1語に英語の動詞は複数ある。discuss・attend・marry は前置詞を付けない。",
  },
  {
    id: "quantifier",
    label: "数量表現",
    description: "many / much / a few / most of / more than などの量の表し方。",
    hint: "可算は many / a few、不可算は much / a little。most of the ... のように of + the を落とさない。",
  },
  {
    id: "request",
    label: "依頼・提案の型",
    description: "依頼・許可・申し出・提案の定型表現と、その丁寧さの段差。",
    hint: "依頼は Could you ...?、許可は May I ...?、提案は Why don't we ...? / Shall we ...?。",
  },
] as const satisfies readonly GrammarTag[];

/** タグID。統計の保存キーであり、AI採点が返すIDの検証にも使う */
export type GrammarTagId = (typeof GRAMMAR_TAGS)[number]["id"];

export const GRAMMAR_TAG_IDS: GrammarTagId[] = GRAMMAR_TAGS.map((tag) => tag.id);

const TAG_BY_ID = new Map<string, GrammarTag>(GRAMMAR_TAGS.map((tag) => [tag.id, tag]));

/**
 * 未定義のIDを弾いてから GrammarTag を返す。
 *
 * AIは頼んでいないIDを平気で作る（"articles-plural" など）。存在しない
 * タグの統計を作ってしまうと、分析画面に一度も出題していない弱点が
 * 並び、しかもそれを埋める問題がプールに無いという行き止まりができる。
 * 外から来たIDは必ずここを通す。
 */
export function findGrammarTag(id: string): GrammarTag | null {
  return TAG_BY_ID.get(id) ?? null;
}

export function isGrammarTagId(id: unknown): id is GrammarTagId {
  return typeof id === "string" && TAG_BY_ID.has(id);
}

/** 表示用の短い名前。未定義のIDはそのまま返さず「その他」に丸める */
export function getTagLabel(id: string): string {
  return TAG_BY_ID.get(id)?.label ?? "その他";
}
