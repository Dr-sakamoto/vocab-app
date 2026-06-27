import kuromoji from "kuromoji";
import { normalizeAnswer, normalizeForMorphology } from "./answerNormalization.js";

const TOKENIZER_DIC_PATH = "node_modules/kuromoji/dict";
const IGNORE_POS = new Set(["助詞", "助動詞", "記号", "接頭詞", "フィラー"]);
const CONTENT_POS = new Set(["名詞", "動詞", "形容詞", "副詞"]);

const SYNONYM_GROUPS = [
  ["軽減", "緩和", "和らげる", "軽くする", "改善", "改善する"],
  ["実行", "実施", "遂行", "行う", "実装", "導入"],
  ["調査", "検査", "精査", "吟味", "究明", "調べる"],
  ["影響", "反響", "余波", "結果"],
  ["遵守", "従う", "守る", "固守"],
  ["説得力", "有力", "強力", "納得"],
  ["回復力", "復元力", "しなやか", "立ち直る"],
  ["有害", "悪影響", "害", "不利益"],
  ["裕福", "富裕", "豊か", "金持ち"],
  ["相当", "かなり", "大幅", "重大", "実質的"],
  ["説明", "報告", "記述", "理由"],
  ["合意", "総意", "一致", "同意"],
  ["抑制", "制限", "抑える", "食い止める"],
  ["強調", "目立たせる", "浮き彫り", "際立たせる"],
  ["探す", "求める", "追求", "探索"],
  ["新しい", "斬新", "新規", "革新的"],
  ["一貫", "整合", "矛盾ない", "一致"],
  ["頼る", "依存", "信頼"],
  ["状況", "事情", "環境"],
  ["延期", "先延ばし", "繰り延べ", "後回し"],
  ["獲得", "取得", "入手", "得る"],
  ["包括", "総合", "網羅", "包括的"],
  ["促進", "推進", "奨励", "育成"],
  ["維持", "保つ", "保持", "持続"],
  ["弱める", "損なう", "低下", "侵食"],
  ["評価", "査定", "見積もり", "判断"],
  ["処方", "指示", "規定"],
  ["排出", "放出", "発散"],
  ["参加", "参画", "加わる"],
  ["遭遇", "出会う", "直面", "巡り合う"],
  ["配分", "割り当て", "配布", "分配"],
  ["減少", "低下", "衰退", "下落"],
  ["対処", "取り組む", "扱う", "演説"],
  ["補償", "埋め合わせ", "償う"],
  ["援助", "支援", "助け", "補助"],
  ["強化", "補強", "増強"],
  ["改訂", "修正", "改正", "見直し"],
  ["公開", "開示", "暴露", "明かす"],
  ["十分", "充分", "足りる"],
  ["制裁", "罰則", "処罰"],
  ["再現", "複製", "再作成"],
  ["激しい", "猛烈", "強烈", "熾烈"],
  ["予期", "予想", "想定", "見込み"],
  ["透明性", "明瞭性", "開放性"],
  ["交渉", "協議", "折衝"],
  ["描写", "描く", "表現"],
  ["採用", "募集", "雇用"],
  ["主に", "主として", "第一に"],
  ["制限", "限定", "限られる"],
  ["明確", "明らか", "はっきり", "明示"],
  ["同情", "共感", "思いやり", "哀れみ"],
  ["冒険", "挑戦", "ベンチャー"],
  ["廃止", "撤廃", "取り除く", "排除"],
  ["許す", "容赦", "赦免"],
  ["著名", "名声", "評判"],
  ["控えめ", "謙虚", "慎ましい"],
  ["汚染", "公害"],
  ["残酷", "冷酷", "非情"],
  ["恐ろしい", "ひどい", "ぞっとする"],
  ["跳ぶ", "跳躍", "飛び越える"],
  ["能力", "容量", "収容力"],
  ["混ぜる", "融合", "調和"],
  ["広大", "莫大", "膨大"],
  ["悲しみ", "悲嘆", "嘆き"],
  ["不可欠", "必須", "本質的", "重要"],
  ["構成", "部品", "要素"],
  ["混沌", "無秩序", "混乱"],
  ["思い出す", "回想", "想起"],
  ["改善", "改良", "好転"],
  ["適切", "妥当", "ふさわしい"],
  ["集まる", "集合", "集結"],
  ["大胆", "厚かましい", "ずうずうしい"],
  ["永続", "永久", "不変"],
  ["保証", "確信", "安心させる"],
  ["同期", "同調"],
  ["つかむ", "捕らえる", "奪う"],
  ["受け入れる", "抱く", "包含"],
  ["自慢", "誇る"],
  ["使い果たす", "消耗", "疲弊"],
  ["閉じ込める", "制限", "限定"],
  ["記念", "祝賀"],
  ["支配", "優勢", "優位"],
  ["受動", "消極", "受け身"],
  ["慣れる", "順応"],
  ["言葉", "口頭", "言語"],
  ["進化", "発展"],
  ["有能", "適任", "能力がある"],
  ["詐欺", "だます"],
  ["寮", "寄宿舎"],
  ["孤独", "独居"],
  ["侵入者", "侵入"],
  ["さまよう", "放浪", "歩き回る"],
  ["思いとどまらせる", "落胆", "妨げる"],
  ["課す", "押し付ける", "負わせる"],
  ["絶対", "完全"],
  ["燃えやすい", "可燃"],
  ["予測", "予言", "見通し"],
  ["褒め言葉", "賛辞"],
  ["遺物", "人工物", "工芸品"],
  ["削減", "減らす", "縮小"],
  ["避ける", "回避", "かわす"],
  ["栄養", "養う", "育てる"],
  ["幅広い", "多様", "広範"],
  ["証人", "目撃", "目撃者"],
  ["原始", "初期", "未開"],
  ["降格", "格下げ"],
  ["歪める", "文字化け", "誤って伝える"],
  ["没頭", "浸す", "熱中"],
  ["控える", "慎む"],
  ["露骨", "明白", "あからさま"],
  ["除け者", "追放者"],
  ["詰まる", "窒息", "塞ぐ"],
  ["鮮明", "歯切れ", "ぱりぱり"],
  ["廊下", "通路"],
  ["生成", "生み出す", "発生"],
  ["ずさん", "だらしない"],
  ["対立", "衝突", "葛藤"],
  ["確信", "信念", "有罪判決"],
  ["穏やか", "平静", "落ち着いた"],
  ["束", "包み"],
  ["注釈", "注記"],
  ["皮肉", "嫌味"],
  ["本能", "直感"],
  ["緩衝", "和らげる", "バッファ"],
  ["時代遅れ", "古い"],
  ["酸性", "辛辣"],
  ["差別", "識別", "見分ける"],
  ["合理", "理性", "論理的"],
  ["基礎", "土台", "財団"],
  ["活気", "鮮やか", "生き生き"],
];

let tokenizerPromise;
let synonymIndex;

function getTokenizer() {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: TOKENIZER_DIC_PATH }).build((error, tokenizer) => {
        if (error) reject(error);
        else resolve(tokenizer);
      });
    });
  }

  return tokenizerPromise;
}

function kanaToHiragana(value) {
  return String(value ?? "").replace(/[\u30A1-\u30F6]/g, char =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

function tokenBase(token) {
  if (token.base_form && token.base_form !== "*") return token.base_form;
  return token.surface_form ?? "";
}

function tokenReading(token) {
  const reading = token.reading && token.reading !== "*" ? token.reading : tokenBase(token);
  return kanaToHiragana(normalizeAnswer(reading));
}

function isContentToken(token) {
  if (!token?.surface_form) return false;
  if (IGNORE_POS.has(token.pos)) return false;
  if (!CONTENT_POS.has(token.pos)) return false;
  return normalizeAnswer(token.surface_form).length > 0;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isKanaOnly(value) {
  return /^[ぁ-ゖー〜]+$/.test(String(value ?? ""));
}

export function getCoreTermsFromTokens(tokens) {
  const terms = tokens
    .filter(isContentToken)
    .map(token => ({
      surface: normalizeAnswer(token.surface_form),
      base: normalizeAnswer(tokenBase(token)),
      reading: tokenReading(token),
      pos: token.pos,
    }));

  if (terms.length > 0) return terms;

  return unique(tokens.map(token => normalizeAnswer(token.surface_form))).map(term => ({
    surface: term,
    base: term,
    reading: term,
    pos: "unknown",
  }));
}

export async function analyzeAnswer(value) {
  const tokenizer = await getTokenizer();
  const normalized = normalizeAnswer(value);
  const tokens = tokenizer.tokenize(normalizeForMorphology(value));
  const terms = getCoreTermsFromTokens(tokens);
  const baseKey = terms.map(term => term.base).join("");
  const readingKey = terms.map(term => term.reading).join("");
  const termKeys = unique(terms.flatMap(term => [term.base, term.reading, term.surface]));

  return {
    normalized,
    baseKey: baseKey || normalized,
    readingKey: readingKey || normalized,
    termKeys: termKeys.length ? termKeys : [normalized],
    terms,
    tokens,
  };
}

function checkPosViolation(tokens, partOfSpeech) {
  if (!partOfSpeech || tokens.length === 0) return null;

  if (partOfSpeech === "adjective") {
    // 副詞トークンが直接ある場合
    if (tokens.some(t => t.pos === "副詞")) {
      return "副詞の形（〜に/〜く）ではなく、形容詞の形（〜な/〜い）で答えてください";
    }

    // 形容動詞語幹 + 助詞「に」のパターン（例: 深刻に、重大に）
    for (let i = 0; i < tokens.length - 1; i++) {
      if (
        tokens[i].pos_detail_1 === "形容動詞語幹" &&
        tokens[i + 1].surface_form === "に" &&
        tokens[i + 1].pos === "助詞"
      ) {
        return "「〜に」は副詞的な使い方です。形容詞として「〜な/〜的な」の形で答えてください";
      }
    }

    // 形容詞が連用形のみ（例: 激しく）—基本形の形容詞がある場合は除外（例: 避けられない）
    const adjTokens = tokens.filter(t => t.pos === "形容詞");
    const hasBaseAdj = adjTokens.some(t => t.conjugated_form === "基本形");
    const hasAdverbialAdj = adjTokens.some(
      t => t.conjugated_form === "連用テ接続" || t.conjugated_form === "連用形",
    );
    if (hasAdverbialAdj && !hasBaseAdj) {
      return "「〜く」は副詞的な形です。形容詞の基本形（〜い/〜な）で答えてください";
    }
  }

  if (partOfSpeech === "verb") {
    const hasVerb = tokens.some(t => t.pos === "動詞");
    if (!hasVerb && tokens.some(t => t.pos === "名詞" || t.pos === "形容詞")) {
      return "動詞の形（〜する/〜る/〜う）で答えましょう";
    }
  }

  return null;
}

function getSynonymIndex() {
  if (synonymIndex) return synonymIndex;

  synonymIndex = new Map();
  SYNONYM_GROUPS.forEach((group, groupIndex) => {
    for (const word of group) {
      const key = normalizeAnswer(word);
      if (!key) continue;
      const ids = synonymIndex.get(key) ?? new Set();
      ids.add(groupIndex);
      synonymIndex.set(key, ids);
    }
  });

  return synonymIndex;
}

function hasSharedSynonym(leftKeys, rightKeys) {
  const index = getSynonymIndex();
  const leftGroupIds = new Set();

  for (const key of leftKeys) {
    for (const groupId of index.get(key) ?? []) leftGroupIds.add(groupId);
  }

  if (leftGroupIds.size === 0) return false;

  for (const key of rightKeys) {
    for (const groupId of index.get(key) ?? []) {
      if (leftGroupIds.has(groupId)) return true;
    }
  }

  return false;
}

function isAlternativeMatch(userAnalysis, answerAnalysis) {
  if (userAnalysis.baseKey === answerAnalysis.baseKey) return true;
  if (isKanaOnly(userAnalysis.normalized) && userAnalysis.normalized === answerAnalysis.readingKey) return true;
  if (isKanaOnly(answerAnalysis.normalized) && answerAnalysis.normalized === userAnalysis.readingKey) return true;

  const userKeys = unique([
    userAnalysis.baseKey,
    userAnalysis.readingKey,
    ...userAnalysis.termKeys,
  ]);
  const answerKeys = unique([
    answerAnalysis.baseKey,
    answerAnalysis.readingKey,
    ...answerAnalysis.termKeys,
  ]);

  return hasSharedSynonym(userKeys, answerKeys);
}

export async function evaluateAnswer({ input, answers, partOfSpeech }) {
  const safeAnswers = Array.isArray(answers) ? answers : [];
  const normalizedInput = normalizeAnswer(input);
  const normalizedAnswers = safeAnswers.map(normalizeAnswer);

  if (!normalizedInput || safeAnswers.length === 0) {
    return { status: "wrong", normalizedInput, normalizedAnswers };
  }

  if (normalizedAnswers.includes(normalizedInput)) {
    return { status: "exact", normalizedInput, normalizedAnswers };
  }

  const userAnalysis = await analyzeAnswer(input);
  const answerAnalyses = await Promise.all(safeAnswers.map(analyzeAnswer));
  const matchedAnswerIndex = answerAnalyses.findIndex(answerAnalysis =>
    isAlternativeMatch(userAnalysis, answerAnalysis),
  );

  if (matchedAnswerIndex >= 0) {
    return {
      status: "alternative",
      normalizedInput,
      normalizedAnswers,
      matchedAnswer: safeAnswers[matchedAnswerIndex],
      userCore: userAnalysis.baseKey,
      answerCore: answerAnalyses[matchedAnswerIndex].baseKey,
    };
  }

  const posViolation = checkPosViolation(userAnalysis.tokens, partOfSpeech);
  return { status: "wrong", normalizedInput, normalizedAnswers, posViolation };
}
