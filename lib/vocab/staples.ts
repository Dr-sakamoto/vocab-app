import { VocabItem } from "../types";

/**
 * 英検準1級の定番語のうち、元データ（basic.ts / advanced.ts、英語漬け.com の
 * 英検準1級プール）に無かった語の補充分。
 *
 * 元データの配列順は「出る順」という意味を持つので、そこには混ぜずに別に置く。
 * 出る順の情報を持たないため、出題順では初期プールの後ろへ一定間隔で
 * 差し込む（scripts/gen-difficulty-order.mjs）。
 *
 * 選定は英検の公式リストに基づくものではない。準1級対策で定番とされる語の
 * うち未収録のもの（mitigate / exacerbate / stringent など）を拾い、
 * 訳語とあわせてレビューで確認する前提で入れている。
 */
export const QUESTIONS: Omit<VocabItem, "id">[] = [
  {
    "target": "abundant",
    "partOfSpeech": "adjective",
    "answers": [
      "豊富な",
      "たくさんの"
    ]
  },
  {
    "target": "arbitrary",
    "partOfSpeech": "adjective",
    "answers": [
      "恣意的な",
      "任意の",
      "独断的な"
    ]
  },
  {
    "target": "belligerent",
    "partOfSpeech": "adjective",
    "answers": [
      "好戦的な",
      "けんか腰の"
    ]
  },
  {
    "target": "benevolent",
    "partOfSpeech": "adjective",
    "answers": [
      "慈悲深い",
      "善意の"
    ]
  },
  {
    "target": "bolster",
    "partOfSpeech": "verb",
    "answers": [
      "強化する",
      "支える",
      "後押しする"
    ]
  },
  {
    "target": "cease",
    "partOfSpeech": "verb",
    "answers": [
      "やめる",
      "終わる",
      "停止する"
    ]
  },
  {
    "target": "circumvent",
    "partOfSpeech": "verb",
    "answers": [
      "回避する",
      "迂回する"
    ]
  },
  {
    "target": "coerce",
    "partOfSpeech": "verb",
    "answers": [
      "強要する",
      "強制する"
    ]
  },
  {
    "target": "collaborate",
    "partOfSpeech": "verb",
    "answers": [
      "協力する",
      "共同で行う"
    ]
  },
  {
    "target": "confiscate",
    "partOfSpeech": "verb",
    "answers": [
      "没収する",
      "押収する"
    ]
  },
  {
    "target": "conversely",
    "partOfSpeech": "adverb",
    "answers": [
      "逆に",
      "反対に"
    ]
  },
  {
    "target": "corroborate",
    "partOfSpeech": "verb",
    "answers": [
      "裏付ける",
      "確証する"
    ]
  },
  {
    "target": "credible",
    "partOfSpeech": "adjective",
    "answers": [
      "信頼できる",
      "信用できる"
    ]
  },
  {
    "target": "culminate",
    "partOfSpeech": "verb",
    "answers": [
      "最高潮に達する",
      "頂点に達する",
      "ついに〜となる"
    ]
  },
  {
    "target": "curtail",
    "partOfSpeech": "verb",
    "answers": [
      "削減する",
      "縮小する",
      "制限する"
    ]
  },
  {
    "target": "dearth",
    "partOfSpeech": "noun",
    "answers": [
      "不足",
      "欠乏"
    ]
  },
  {
    "target": "decimate",
    "partOfSpeech": "verb",
    "answers": [
      "激減させる",
      "大量に殺す"
    ]
  },
  {
    "target": "deficit",
    "partOfSpeech": "noun",
    "answers": [
      "赤字",
      "不足"
    ]
  },
  {
    "target": "degrade",
    "partOfSpeech": "verb",
    "answers": [
      "劣化させる",
      "悪化させる",
      "品位を下げる"
    ]
  },
  {
    "target": "deplete",
    "partOfSpeech": "verb",
    "answers": [
      "枯渇させる",
      "使い果たす",
      "激減させる"
    ]
  },
  {
    "target": "deviate",
    "partOfSpeech": "verb",
    "answers": [
      "逸脱する",
      "それる"
    ]
  },
  {
    "target": "discrepancy",
    "partOfSpeech": "noun",
    "answers": [
      "食い違い",
      "不一致"
    ]
  },
  {
    "target": "disperse",
    "partOfSpeech": "verb",
    "answers": [
      "分散させる",
      "解散させる",
      "散らす"
    ]
  },
  {
    "target": "divert",
    "partOfSpeech": "verb",
    "answers": [
      "そらす",
      "転用する",
      "迂回させる"
    ]
  },
  {
    "target": "dormant",
    "partOfSpeech": "adjective",
    "answers": [
      "休眠中の",
      "活動していない"
    ]
  },
  {
    "target": "dwindle",
    "partOfSpeech": "verb",
    "answers": [
      "次第に減少する",
      "縮小する"
    ]
  },
  {
    "target": "elicit",
    "partOfSpeech": "verb",
    "answers": [
      "引き出す",
      "聞き出す"
    ]
  },
  {
    "target": "embezzle",
    "partOfSpeech": "verb",
    "answers": [
      "横領する",
      "着服する"
    ]
  },
  {
    "target": "enhance",
    "partOfSpeech": "verb",
    "answers": [
      "高める",
      "向上させる",
      "強化する"
    ]
  },
  {
    "target": "entail",
    "partOfSpeech": "verb",
    "answers": [
      "伴う",
      "必要とする"
    ]
  },
  {
    "target": "eradicate",
    "partOfSpeech": "verb",
    "answers": [
      "根絶する",
      "撲滅する"
    ]
  },
  {
    "target": "erode",
    "partOfSpeech": "verb",
    "answers": [
      "侵食する",
      "むしばむ",
      "損なう"
    ]
  },
  {
    "target": "exacerbate",
    "partOfSpeech": "verb",
    "answers": [
      "悪化させる"
    ]
  },
  {
    "target": "exhilarating",
    "partOfSpeech": "adjective",
    "answers": [
      "爽快な",
      "うきうきさせる"
    ]
  },
  {
    "target": "expedite",
    "partOfSpeech": "verb",
    "answers": [
      "促進する",
      "早める"
    ]
  },
  {
    "target": "fluctuate",
    "partOfSpeech": "verb",
    "answers": [
      "変動する"
    ]
  },
  {
    "target": "forfeit",
    "partOfSpeech": "verb",
    "answers": [
      "失う",
      "没収される",
      "放棄する"
    ]
  },
  {
    "target": "hamper",
    "partOfSpeech": "verb",
    "answers": [
      "妨げる",
      "邪魔する"
    ]
  },
  {
    "target": "hazardous",
    "partOfSpeech": "adjective",
    "answers": [
      "危険な",
      "有害な"
    ]
  },
  {
    "target": "impartial",
    "partOfSpeech": "adjective",
    "answers": [
      "公平な",
      "偏らない"
    ]
  },
  {
    "target": "imperative",
    "partOfSpeech": "adjective",
    "answers": [
      "必須の",
      "緊急の",
      "不可欠な"
    ]
  },
  {
    "target": "incessant",
    "partOfSpeech": "adjective",
    "answers": [
      "絶え間ない",
      "ひっきりなしの"
    ]
  },
  {
    "target": "induce",
    "partOfSpeech": "verb",
    "answers": [
      "誘発する",
      "引き起こす",
      "説得して〜させる"
    ]
  },
  {
    "target": "infringe",
    "partOfSpeech": "verb",
    "answers": [
      "侵害する",
      "違反する"
    ]
  },
  {
    "target": "inhibit",
    "partOfSpeech": "verb",
    "answers": [
      "抑制する",
      "妨げる"
    ]
  },
  {
    "target": "innate",
    "partOfSpeech": "adjective",
    "answers": [
      "生まれつきの",
      "先天的な"
    ]
  },
  {
    "target": "insolvent",
    "partOfSpeech": "adjective",
    "answers": [
      "支払い不能の",
      "破産した"
    ]
  },
  {
    "target": "intervene",
    "partOfSpeech": "verb",
    "answers": [
      "介入する",
      "仲裁する"
    ]
  },
  {
    "target": "intricate",
    "partOfSpeech": "adjective",
    "answers": [
      "複雑な",
      "入り組んだ"
    ]
  },
  {
    "target": "invoke",
    "partOfSpeech": "verb",
    "answers": [
      "発動する",
      "引き合いに出す",
      "祈る"
    ]
  },
  {
    "target": "lavish",
    "partOfSpeech": "adjective",
    "answers": [
      "豪華な",
      "気前のよい",
      "ぜいたくな"
    ]
  },
  {
    "target": "lenient",
    "partOfSpeech": "adjective",
    "answers": [
      "寛大な",
      "甘い"
    ]
  },
  {
    "target": "mandatory",
    "partOfSpeech": "adjective",
    "answers": [
      "義務的な",
      "強制的な",
      "必須の"
    ]
  },
  {
    "target": "meticulous",
    "partOfSpeech": "adjective",
    "answers": [
      "細心の",
      "綿密な",
      "几帳面な"
    ]
  },
  {
    "target": "mitigate",
    "partOfSpeech": "verb",
    "answers": [
      "和らげる",
      "軽減する"
    ]
  },
  {
    "target": "offset",
    "partOfSpeech": "verb",
    "answers": [
      "相殺する",
      "埋め合わせる"
    ]
  },
  {
    "target": "outskirts",
    "partOfSpeech": "noun",
    "answers": [
      "郊外",
      "町はずれ"
    ]
  },
  {
    "target": "paramount",
    "partOfSpeech": "adjective",
    "answers": [
      "最も重要な",
      "最高の"
    ]
  },
  {
    "target": "perpetrator",
    "partOfSpeech": "noun",
    "answers": [
      "犯人",
      "加害者"
    ]
  },
  {
    "target": "pertinent",
    "partOfSpeech": "adjective",
    "answers": [
      "関係のある",
      "適切な"
    ]
  },
  {
    "target": "plausible",
    "partOfSpeech": "adjective",
    "answers": [
      "もっともらしい",
      "妥当な"
    ]
  },
  {
    "target": "prolific",
    "partOfSpeech": "adjective",
    "answers": [
      "多作の",
      "多産な"
    ]
  },
  {
    "target": "rampant",
    "partOfSpeech": "adjective",
    "answers": [
      "横行する",
      "はびこる",
      "蔓延する"
    ]
  },
  {
    "target": "ratify",
    "partOfSpeech": "verb",
    "answers": [
      "批准する",
      "承認する"
    ]
  },
  {
    "target": "refute",
    "partOfSpeech": "verb",
    "answers": [
      "反駁する",
      "論破する",
      "否定する"
    ]
  },
  {
    "target": "reimburse",
    "partOfSpeech": "verb",
    "answers": [
      "払い戻す",
      "返済する",
      "弁償する"
    ]
  },
  {
    "target": "relinquish",
    "partOfSpeech": "verb",
    "answers": [
      "放棄する",
      "手放す"
    ]
  },
  {
    "target": "retaliate",
    "partOfSpeech": "verb",
    "answers": [
      "報復する",
      "仕返しする"
    ]
  },
  {
    "target": "slander",
    "partOfSpeech": "noun",
    "answers": [
      "中傷",
      "名誉毀損"
    ]
  },
  {
    "target": "sparse",
    "partOfSpeech": "adjective",
    "answers": [
      "まばらな",
      "乏しい"
    ]
  },
  {
    "target": "stringent",
    "partOfSpeech": "adjective",
    "answers": [
      "厳しい",
      "厳格な"
    ]
  },
  {
    "target": "substantiate",
    "partOfSpeech": "verb",
    "answers": [
      "立証する",
      "裏付ける"
    ]
  },
  {
    "target": "succumb",
    "partOfSpeech": "verb",
    "answers": [
      "屈する",
      "負ける",
      "倒れる"
    ]
  },
  {
    "target": "susceptible",
    "partOfSpeech": "adjective",
    "answers": [
      "影響を受けやすい",
      "かかりやすい",
      "敏感な"
    ]
  },
  {
    "target": "wary",
    "partOfSpeech": "adjective",
    "answers": [
      "用心深い",
      "警戒している"
    ]
  },
  {
    "target": "yield",
    "partOfSpeech": "verb",
    "answers": [
      "生み出す",
      "もたらす",
      "屈する",
      "譲る"
    ]
  },
  {
    "target": "zealous",
    "partOfSpeech": "adjective",
    "answers": [
      "熱心な",
      "熱狂的な"
    ]
  }
];
