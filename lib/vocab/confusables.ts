/**
 * 間違えた語の隣に並べる「紛らわしい語」。
 *
 * 英検準1級の語彙問題（大問1）の選択肢は、綴りや意味が似た語どうしで
 * 並ぶ（alleviate / aggravate / allocate …）。意味を1つ覚えるだけでなく、
 * 似た語と区別できて初めて得点になる。結果発表で落とした語を読み返す
 * ときにだけ添える（出題中は出さない）。
 *
 * 【書くときの約束】
 * - 本当に取り違えやすい相手がいる語だけに書く。全語に埋めない
 * - relation は form（綴り・音が似ている）/ meaning（意味が近い）/
 *   opposite（反対の意味）のどれか
 * - meaning は相手の語の代表的な訳を1つ
 * - キーは lib/vocab/wordId.ts の安定ID。相手の語が収録語にあれば、
 *   逆向きは lib/vocab/index.ts の getConfusable が自動で補う
 */
export type ConfusableRelation = "form" | "meaning" | "opposite";

export interface Confusable {
  word: string;
  meaning: string;
  relation: ConfusableRelation;
}

const f = (word: string, meaning: string): Confusable => ({ word, meaning, relation: "form" });
const m = (word: string, meaning: string): Confusable => ({ word, meaning, relation: "meaning" });
const o = (word: string, meaning: string): Confusable => ({ word, meaning, relation: "opposite" });

export const CONFUSABLES: Readonly<Record<string, Confusable>> = {
  "alleviate:verb": f("aggravate", "悪化させる"),
  "adhere:verb": f("adopt", "採用する"),
  "compelling:adjective": f("compulsory", "義務的な"),
  "resilience:noun": f("resistance", "抵抗"),
  "detrimental:adjective": o("beneficial", "有益な"),
  "affluent:adjective": o("impoverished", "貧窮した"),
  "substantial:adjective": f("substitute", "代わりに用いる"),
  "curb:verb": m("curtail", "削減する"),
  "novel:adjective": f("noble", "気高い"),
  "consistent:adjective": f("persistent", "粘り強い"),
  "rely:verb": f("relay", "中継する"),
  "postpone:verb": m("suspend", "一時停止する"),
  "acquire:verb": f("inquire", "尋ねる"),
  "comprehensive:adjective": f("comprehensible", "理解できる"),
  "promote:verb": m("facilitate", "容易にする"),
  "undermine:verb": f("underline", "強調する"),
  "evaluate:verb": f("evacuate", "避難させる"),
  "prescribe:verb": f("proscribe", "禁止する"),
  "emissions:noun": f("omissions", "省略"),
  "allocate:verb": f("relocate", "移転させる"),
  "decline:noun": f("incline", "傾向"),
  "restrict:verb": f("restrain", "抑える"),
  "reinforce:verb": f("enforce", "施行する"),
  "revise:verb": f("revive", "生き返らせる"),
  "distribute:verb": f("contribute", "貢献する"),
  "investigate:verb": f("instigate", "扇動する"),
  "disclose:verb": f("enclose", "同封する"),
  "sufficient:adjective": f("efficient", "効率的な"),
  "sanctions:noun": f("sanctuary", "聖域"),
  "replicate:verb": f("implicate", "巻き込む"),
  "fierce:adjective": f("pierce", "突き刺す"),
  "unforeseen:adjective": m("unprecedented", "前例のない"),
  "negotiate:verb": m("mediate", "調停する"),
  "depict:verb": f("deplete", "使い果たす"),
  "foster:verb": m("nurture", "育てる"),
  "pursue:verb": f("persuade", "説得する"),
  "clarify:verb": f("classify", "分類する"),
  "sympathetic:adjective": f("apathetic", "無関心な"),
  "spontaneous:adjective": f("simultaneous", "同時の"),
  "modest:adjective": f("moderate", "適度な"),
  "conclusive:adjective": f("inclusive", "包括的な"),
  "spectator:noun": f("speculator", "投機家"),
  "abundant:adjective": f("redundant", "余分な"),
  "cease:verb": f("seize", "つかむ"),
  "yield:verb": f("wield", "振るう"),
  "boast:verb": f("boost", "高める"),
  "mandatory:adjective": o("voluntary", "自発的な"),
  "prestigious:adjective": f("prodigious", "並外れた"),
  "enhance:verb": o("diminish", "減らす"),
  "divert:verb": f("convert", "転換する"),
  "frank:adjective": m("candid", "率直な"),
  "hazardous:adjective": o("harmless", "無害な"),
  "vague:adjective": m("ambiguous", "あいまいな"),
  "harsh:adjective": o("lenient", "寛大な"),
  "benevolent:adjective": o("malevolent", "悪意のある"),
  "vanish:verb": f("banish", "追放する"),
  "deficit:noun": o("surplus", "黒字"),
  "discern:verb": m("distinguish", "区別する"),
  "invoke:verb": f("evoke", "呼び起こす"),
  "weary:adjective": f("wary", "用心深い"),
  "impartial:adjective": o("partial", "偏った"),
  "innate:adjective": o("acquired", "後天的な"),
  "deliberate:adjective": o("accidental", "偶然の"),
  "refute:verb": f("refuse", "拒む"),
  "arbitrary:adjective": f("arbitrate", "仲裁する"),
  "devote:verb": f("denote", "示す"),
  "offensive:adjective": o("defensive", "防御的な"),
  "fortunate:adjective": f("fortuitous", "偶然の"),
  "grief:noun": f("grievance", "不満"),
  "shallow:adjective": f("hollow", "空洞の"),
  "leap:verb": f("reap", "収穫する"),
  "confess:verb": f("profess", "公言する"),
  "intent:noun": f("intense", "激しい"),
  "temper:noun": f("tamper", "いじる"),
  "loyalty:noun": f("royalty", "王族"),
  "invade:verb": f("evade", "逃れる"),
  "reception:noun": f("perception", "知覚"),
  "capacity:noun": m("capability", "能力"),
  "blend:verb": f("bland", "味気ない"),
  "instruct:verb": f("obstruct", "妨げる"),
  "starve:verb": f("strive", "努力する"),
  "unite:verb": f("untie", "ほどく"),
  "bold:adjective": f("bald", "はげた"),
  "convention:noun": f("conversion", "転換"),
  "seclusion:noun": f("exclusion", "排除"),
  "progression:noun": o("regression", "後退"),
  "consequently:adverb": f("subsequently", "その後"),
  "fare:noun": f("fair", "公平な"),
  "venue:noun": f("revenue", "収入"),
  "pessimism:noun": o("optimism", "楽観主義"),
};
