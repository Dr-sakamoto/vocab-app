"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const questions = [
  {
    sentence: "The company is facing a severe financial crisis.",
    target: "severe",
    answers: ["深刻な"],
  },
  {
    sentence: "The new policy is expected to alleviate the burden on workers.",
    target: "alleviate",
    answers: ["和らげる", "軽減する"],
  },
  {
    sentence: "It is inevitable that prices will rise if demand continues to grow.",
    target: "inevitable",
    answers: ["避けられない", "不可避の"],
  },
  {
    sentence: "The journalist scrutinized the documents for any signs of fraud.",
    target: "scrutinized",
    answers: ["綿密に調べた", "注意深く調べた"],
  },
  {
    sentence: "The company plans to implement a new training program next month.",
    target: "implement",
    answers: ["実施する", "導入する"],
  },
  {
    sentence: "The scandal had serious repercussions for the politician's career.",
    target: "repercussions",
    answers: ["影響", "反響", "余波"],
  },
  {
    sentence: "Students are required to adhere to the rules during the exam.",
    target: "adhere",
    answers: ["従う", "順守する"],
  },
  {
    sentence: "The evidence provides compelling support for the theory.",
    target: "compelling",
    answers: ["説得力のある", "強い印象を与える"],
  },
  {
    sentence: "The region showed remarkable resilience after the disaster.",
    target: "resilience",
    answers: ["回復力", "復元力", "しなやかな強さ"],
  },
  {
    sentence: "Excessive stress can be detrimental to your health.",
    target: "detrimental",
    answers: ["有害な", "悪影響のある"],
  },
  {
    sentence: "Many affluent families donate to local charities.",
    target: "affluent",
    answers: ["裕福な", "豊かな"],
  },
  {
    sentence: "The university received a substantial donation from an alumnus.",
    target: "substantial",
    answers: ["かなりの", "相当な"],
  },
  {
    sentence: "The witness gave a detailed account of the incident.",
    target: "account",
    answers: ["説明", "報告", "口座"],
  },
  {
    sentence: "The committee reached a consensus after a long discussion.",
    target: "consensus",
    answers: ["合意", "総意"],
  },
  {
    sentence: "The government introduced measures to curb inflation.",
    target: "curb",
    answers: ["抑える", "抑制する"],
  },
  {
    sentence: "The report highlights the need for immediate action.",
    target: "highlights",
    answers: ["強調する", "目立たせる"],
  },
  {
    sentence: "The company is seeking to expand its presence overseas.",
    target: "seeking",
    answers: ["求めている", "探している"],
  },
  {
    sentence: "The scientist proposed a novel approach to the problem.",
    target: "novel",
    answers: ["新しい", "斬新な"],
  },
  {
    sentence: "The patient showed symptoms that were consistent with the diagnosis.",
    target: "consistent",
    answers: ["一致した", "矛盾しない"],
  },
  {
    sentence: "The organization relies on volunteers to operate effectively.",
    target: "relies",
    answers: ["頼る", "依存する"],
  },
  {
    sentence: "The judge considered the circumstances surrounding the case.",
    target: "circumstances",
    answers: ["状況", "事情"],
  },
  {
    sentence: "The politician made a controversial remark during the interview.",
    target: "controversial",
    answers: ["物議を醸す", "論争の的となる"],
  },
  {
    sentence: "The manager decided to postpone the meeting until next week.",
    target: "postpone",
    answers: ["延期する", "先延ばしにする"],
  },
  {
    sentence: "The company will acquire a smaller firm to strengthen its position.",
    target: "acquire",
    answers: ["獲得する", "取得する", "買収する"],
  },
  {
    sentence: "The findings were based on a comprehensive survey of residents.",
    target: "comprehensive",
    answers: ["包括的な", "総合的な"],
  },
  {
    sentence: "The policy is intended to promote equality in the workplace.",
    target: "promote",
    answers: ["促進する", "推進する"],
  },
  {
    sentence: "The company struggled to maintain stability during the recession.",
    target: "maintain",
    answers: ["維持する", "保つ"],
  },
  {
    sentence: "The new evidence undermines the previous explanation.",
    target: "undermines",
    answers: ["弱める", "損なう"],
  },
  {
    sentence: "The committee will evaluate the proposal before making a decision.",
    target: "evaluate",
    answers: ["評価する", "査定する"],
  },
  {
    sentence: "The doctor prescribed medication to relieve the pain.",
    target: "prescribed",
    answers: ["処方した"],
  },
  {
    sentence: "The company faced a lawsuit due to alleged discrimination.",
    target: "alleged",
    answers: ["申し立てられた", "容疑のある"],
  },
  {
    sentence: "The city aims to reduce emissions by improving public transportation.",
    target: "emissions",
    answers: ["排出量", "排出物"],
  },
  {
    sentence: "The teacher encouraged students to participate in the debate.",
    target: "participate",
    answers: ["参加する"],
  },
  {
    sentence: "The plan is likely to encounter resistance from local residents.",
    target: "encounter",
    answers: ["遭遇する", "直面する"],
  },
  {
    sentence: "The company will allocate additional resources to the project.",
    target: "allocate",
    answers: ["配分する", "割り当てる"],
  },
  {
    sentence: "The researcher observed a significant decline in sales.",
    target: "decline",
    answers: ["減少", "低下"],
  },
  {
    sentence: "The government must address the issue of poverty urgently.",
    target: "address",
    answers: ["取り組む", "対処する", "演説する"],
  },
  {
    sentence: "The company decided to compensate the customers for the inconvenience.",
    target: "compensate",
    answers: ["補償する", "埋め合わせる"],
  },
  {
    sentence: "The new rules will restrict access to sensitive information.",
    target: "restrict",
    answers: ["制限する"],
  },
  {
    sentence: "The agency provides assistance to refugees.",
    target: "assistance",
    answers: ["援助", "支援"],
  },
  {
    sentence: "The agreement includes a clause that protects consumers.",
    target: "clause",
    answers: ["条項", "句"],
  },
  {
    sentence: "The speaker used statistics to reinforce his argument.",
    target: "reinforce",
    answers: ["強化する", "補強する"],
  },
  {
    sentence: "The company had to revise its strategy after the failure.",
    target: "revise",
    answers: ["改訂する", "修正する"],
  },
  {
    sentence: "The charity will distribute food to those in need.",
    target: "distribute",
    answers: ["配布する", "分配する"],
  },
  {
    sentence: "The study investigates the impact of sleep on memory.",
    target: "investigates",
    answers: ["調査する", "究明する"],
  },
  {
    sentence: "The company refused to disclose the details of the contract.",
    target: "disclose",
    answers: ["公表する", "暴露する"],
  },
  {
    sentence: "The company is committed to ensuring customer satisfaction.",
    target: "committed",
    answers: ["献身的な", "責任を負う"],
  },
  {
    sentence: "The evidence was sufficient to convict the suspect.",
    target: "sufficient",
    answers: ["十分な"],
  },
  {
    sentence: "The government imposed sanctions on the country.",
    target: "sanctions",
    answers: ["制裁"],
  },
  {
    sentence: "The scientists attempted to replicate the experiment.",
    target: "replicate",
    answers: ["再現する", "複製する"],
  },
  {
    sentence: "The company is facing fierce competition in the market.",
    target: "fierce",
    answers: ["激しい", "猛烈な"],
  },
  {
    sentence: "The professor delivered a lecture on economic policy.",
    target: "delivered",
    answers: ["行った", "届けた"],
  },
  {
    sentence: "The project was delayed due to unforeseen complications.",
    target: "unforeseen",
    answers: ["予期しない", "思いがけない"],
  },
  {
    sentence: "The new law will enhance transparency in government spending.",
    target: "transparency",
    answers: ["透明性"],
  },
  {
    sentence: "The company attempted to negotiate a better deal.",
    target: "negotiate",
    answers: ["交渉する"],
  },
  {
    sentence: "The documentary depicts the harsh reality of war.",
    target: "depicts",
    answers: ["描写する", "描く"],
  },
  {
    sentence: "The company aims to foster innovation among employees.",
    target: "foster",
    answers: ["促進する", "育む"],
  },
  {
    sentence: "The organization will recruit more staff to meet demand.",
    target: "recruit",
    answers: ["採用する", "募集する"],
  },
  {
    sentence: "The policy will primarily benefit low-income families.",
    target: "primarily",
    answers: ["主に", "主として"],
  },
  {
    sentence: "The company will pursue opportunities in emerging markets.",
    target: "pursue",
    answers: ["追求する", "追う"],
  },
  {
    sentence: "The results were remarkable given the limited budget.",
    target: "limited",
    answers: ["限られた", "限定された"],
  },
  {
    sentence: "The official issued a statement to clarify the situation.",
    target: "clarify",
    answers: ["明確にする", "はっきりさせる"],
  },
  {
    sentence: "Most parts here are replaceable if they become damaged.",
    target: "replaceable",
    answers: ["置き換えられる"],
  },
  {
    sentence: "A single spark caused the fire to spread rapidly.",
    target: "spark",
    answers: ["火花"],
  },
  {
    sentence: "She felt pity for those affected by the disaster.",
    target: "pity",
    answers: ["同情"],
  },
  {
    sentence: "The rules must be strictly followed in this process.",
    target: "strictly",
    answers: ["厳密に"],
  },
  {
    sentence: "The stars shone brightly in the clear night sky.",
    target: "brightly",
    answers: ["明るく"],
  },
  {
    sentence: "Hang on to your dreams even when times are tough.",
    target: "Hang on",
    answers: ["しがみつく"],
  },
  {
    sentence: "Many students look up to her as a role model.",
    target: "look up to",
    answers: ["尊敬する"],
  },
  {
    sentence: "He was sympathetic to her difficult situation.",
    target: "sympathetic",
    answers: ["思いやりのある"],
  },
  {
    sentence: "We may end up missing the deadline if we delay.",
    target: "end up",
    answers: ["最終的に〜になる"],
  },
  {
    sentence: "Smoke rose from the chimney on the cold morning.",
    target: "chimney",
    answers: ["煙突"],
  },
  {
    sentence: "He lost his temper over a trivial mistake.",
    target: "temper",
    answers: ["気性"],
  },
  {
    sentence: "Their quarrel lasted for several days without resolution.",
    target: "quarrel",
    answers: ["喧嘩"],
  },
  {
    sentence: "The dog began to bark loudly at the stranger.",
    target: "bark",
    answers: ["吠える"],
  },
  {
    sentence: "Loyalty to the team is highly valued here.",
    target: "loyalty",
    answers: ["忠誠"],
  },
  {
    sentence: "His intent was clear from the beginning.",
    target: "intent",
    answers: ["意図"],
  },
  {
    sentence: "I have been very busy lately with my studies.",
    target: "lately",
    answers: ["最近"],
  },
  {
    sentence: "The army attempted to invade the neighboring country.",
    target: "invade",
    answers: ["侵略する"],
  },
  {
    sentence: "She gave him a tender smile after hearing the news.",
    target: "tender",
    answers: ["優しい"],
  },
  {
    sentence: "They carefully mapped out their business strategy.",
    target: "mapped out",
    answers: ["綿密に計画する"],
  },
  {
    sentence: "Her reaction was completely spontaneous and genuine.",
    target: "spontaneous",
    answers: ["自発的な"],
  },
  {
    sentence: "He decided to forgive her for the mistake.",
    target: "forgive",
    answers: ["許す"],
  },
  {
    sentence: "In contrast, this method is more efficient and reliable.",
    target: "In contrast",
    answers: ["対照的に"],
  },
  {
    sentence: "He achieved fame at a young age through his talent.",
    target: "fame",
    answers: ["名声"],
  },
  {
    sentence: "She remained modest despite her great success.",
    target: "modest",
    answers: ["控えめな"],
  },
  {
    sentence: "He pressed the button with his thumb.",
    target: "thumb",
    answers: ["親指"],
  },
  {
    sentence: "The robber escaped before the police arrived.",
    target: "robber",
    answers: ["強盗"],
  },
  {
    sentence: "I was terribly disappointed by the result.",
    target: "terribly",
    answers: ["ひどく"],
  },
  {
    sentence: "She opened the drawer to find the missing document.",
    target: "drawer",
    answers: ["引き出し"],
  },
  {
    sentence: "The meeting was informal but still productive.",
    target: "informal",
    answers: ["非公式な"],
  },
  {
    sentence: "The evidence provided was conclusive and undeniable.",
    target: "conclusive",
    answers: ["決定的な"],
  },
  {
    sentence: "Farmers use fertilizer to improve crop yields.",
    target: "fertilizer",
    answers: ["肥料"],
  },
  {
    sentence: "She takes a holistic approach to health and well-being.",
    target: "holistic",
    answers: ["全体論の"],
  },
  {
    sentence: "He sincerely apologized for the inconvenience caused.",
    target: "sincerely",
    answers: ["心から"],
  },
  {
    sentence: "She expressed deep sympathy for the victims.",
    target: "sympathy",
    answers: ["同情"],
  },
  {
    sentence: "He gently patted the child on the head.",
    target: "pat",
    answers: ["軽くたたく"],
  },
  {
    sentence: "She studied hard in order to achieve her goals.",
    target: "in order to",
    answers: ["〜するために"],
  },
  {
    sentence: "He was a pioneer in the field of modern science.",
    target: "pioneer",
    answers: ["先駆者"],
  },
  {
    sentence: "He tried to mend the broken relationship.",
    target: "mend",
    answers: ["修繕する"],
  },
  {
    sentence: "Air pollution is a serious issue in urban areas.",
    target: "pollution",
    answers: ["汚染"],
  },
  {
    sentence: "She held the rope tightly to avoid falling.",
    target: "tightly",
    answers: ["しっかりと"],
  },
  {
    sentence: "It was cruel to ignore the suffering of others.",
    target: "cruel",
    answers: ["残酷な"],
  },
  {
    sentence: "Plants need oxygen to survive and grow properly.",
    target: "oxygen",
    answers: ["酸素"],
  },
  {
    sentence: "He came down with a cold after working too hard.",
    target: "come down with",
    answers: ["病気にかかる"],
  },
  {
    sentence: "The audience gave loud applause after the performance.",
    target: "applause",
    answers: ["拍手"],
  },
  {
    sentence: "Every spectator was excited by the final match.",
    target: "spectator",
    answers: ["観客"],
  },
  {
    sentence: "I cannot afford to buy such an expensive car.",
    target: "afford to",
    answers: ["する余裕がある"],
  },
  {
    sentence: "The story described the life of a slave in detail.",
    target: "slave",
    answers: ["奴隷"],
  },
  {
    sentence: "He struggled to repay his debt over many years.",
    target: "debt",
    answers: ["借金"],
  },
  {
    sentence: "They managed to tame the wild animal gradually.",
    target: "tame",
    answers: ["飼いならす"],
  },
  {
    sentence: "She stared at the blank page without writing anything.",
    target: "blank",
    answers: ["空白の"],
  },
  {
    sentence: "The gross income does not include tax deductions.",
    target: "gross",
    answers: ["総体的な"],
  },
  {
    sentence: "He worked on another project in the meantime.",
    target: "meantime",
    answers: ["その間に"],
  },
  {
    sentence: "His plan was considered impractical by the committee.",
    target: "impractical",
    answers: ["非実用的な"],
  },
  {
    sentence: "The sturdy bridge can withstand strong winds.",
    target: "sturdy",
    answers: ["頑強な"],
  },
  {
    sentence: "He finally confessed his mistake to his supervisor.",
    target: "confess",
    answers: ["白状する"],
  },
  {
    sentence: "A sudden silence filled the room after the announcement.",
    target: "silence",
    answers: ["沈黙"],
  },
  {
    sentence: "It seemed incredible that he finished so quickly.",
    target: "incredible",
    answers: ["信じられない"],
  },
  {
    sentence: "The food had a nasty smell that made me uncomfortable.",
    target: "nasty",
    answers: ["不快な"],
  },
  {
    sentence: "She placed the letter carefully inside the envelope.",
    target: "envelope",
    answers: ["封筒"],
  },
  {
    sentence: "The building was damaged in an ugly way after the storm.",
    target: "ugly",
    answers: ["醜い"],
  },
  {
    sentence: "The government plans to do away with outdated regulations.",
    target: "do away with",
    answers: ["廃止する"],
  },
  {
    sentence: "It was a horrible experience that I will never forget.",
    target: "horrible",
    answers: ["恐ろしい"],
  },
  {
    sentence: "Prices may leap in response to sudden demand.",
    target: "leap",
    answers: ["急上昇する"],
  },
  {
    sentence: "He washed his hands thoroughly with soap.",
    target: "soap",
    answers: ["せっけん"],
  },
  {
    sentence: "He acted out of spite rather than reason.",
    target: "spite",
    answers: ["悪意"],
  },
  {
    sentence: "They held a warm reception for the visiting guests.",
    target: "reception",
    answers: ["歓迎"],
  },
  {
    sentence: "She made a noble decision despite the risks involved.",
    target: "noble",
    answers: ["気高い"],
  },
  {
    sentence: "The stadium has a seating capacity of fifty thousand.",
    target: "capacity",
    answers: ["容量"],
  },
  {
    sentence: "They blend different ingredients to create a unique flavor.",
    target: "blend",
    answers: ["混ぜる"],
  },
  {
    sentence: "She tucked the papers neatly into her bag.",
    target: "tucked",
    answers: ["押し込む"],
  },
  {
    sentence: "The festival has strong religious significance for locals.",
    target: "religious",
    answers: ["宗教上の"],
  },
  {
    sentence: "He left his laundry to dry in the sunlight.",
    target: "laundry",
    answers: ["洗濯物"],
  },
  {
    sentence: "There was a short interval between the two performances.",
    target: "interval",
    answers: ["間隔"],
  },
  {
    sentence: "The thief attempted to rob a bank in broad daylight.",
    target: "rob",
    answers: ["奪う"],
  },
  {
    sentence: "The desert stretches across a vast area of land.",
    target: "vast",
    answers: ["広大な"],
  },
  {
    sentence: "He struggled to carry his heavy luggage alone.",
    target: "luggage",
    answers: ["荷物"],
  },
  {
    sentence: "She was overwhelmed with grief after the loss.",
    target: "grief",
    answers: ["悲しみ"],
  },
  {
    sentence: "The kettle began to whistle as the water boiled.",
    target: "kettle",
    answers: ["やかん"],
  },
  {
    sentence: "A flock of birds flew across the evening sky.",
    target: "flock",
    answers: ["群れ"],
  },
  {
    sentence: "He quickly fell for a convincing but false story.",
    target: "fell for",
    answers: ["騙される"],
  },
  {
    sentence: "We intend to expand overseas markets within next fiscal year.",
    target: "intend to",
    answers: ["するつもりである"]
  },
  {
    sentence: "The novel describes an adventure across unknown deserts and mountains.",
    target: "adventure",
    answers: ["冒険"]
  },
  {
    sentence: "He loaded vegetables into a cart and headed to the market.",
    target: "cart",
    answers: ["荷車"]
  },
  {
    sentence: "A strong earthquake damaged buildings across the coastal city severely.",
    target: "earthquake",
    answers: ["地震"]
  },
  {
    sentence: "She moved with grace during the ballet performance on stage.",
    target: "grace",
    answers: ["優雅さ"]
  },
  {
    sentence: "The child collected a shell washed up on the beach.",
    target: "shell",
    answers: ["貝殻"]
  },
  {
    sentence: "Artisans weave silk threads into traditional fabrics by hand.",
    target: "weave",
    answers: ["織る"]
  },
  {
    sentence: "He often boasts about his achievements during business meetings.",
    target: "boast",
    answers: ["自慢する"]
  },
  {
    sentence: "The workers will knock down the old factory next month.",
    target: "knock down",
    answers: ["取り壊す"]
  },
  {
    sentence: "The nurse applied a bandage to the athlete's injured arm.",
    target: "bandage",
    answers: ["包帯"]
  },
  {
    sentence: "We had dinner and afterward discussed the project plan.",
    target: "afterward",
    answers: ["その後"]
  },
  {
    sentence: "The manager will instruct employees on new safety rules tomorrow.",
    target: "instruct",
    answers: ["指示する"]
  },
  {
    sentence: "Without food supply, animals in the forest may starve quickly.",
    target: "starve",
    answers: ["飢える"]
  },
  {
    sentence: "The sun disappeared below the horizon as evening approached.",
    target: "horizon",
    answers: ["地平線"]
  },
  {
    sentence: "Police decided to arrest the suspect after gathering evidence.",
    target: "arrest",
    answers: ["逮捕する"]
  },
  {
    sentence: "The company had to lay off several workers due to cuts.",
    target: "lay off",
    answers: ["解雇する"]
  },
  {
    sentence: "She received a scholarship from a prestigious university abroad.",
    target: "prestigious",
    answers: ["名声のある"]
  },
  {
    sentence: "He studies geography to understand human and environmental relations.",
    target: "geography",
    answers: ["地理学"]
  },
  {
    sentence: "The price is charged per item sold in the store.",
    target: "per",
    answers: ["〜ごとに"]
  },
  {
    sentence: "You should not take his statement at face value.",
    target: "at face value",
    answers: ["額面通り"]
  },
  {
    sentence: "The machine tends to act up when it overheats.",
    target: "act up",
    answers: ["不調になる"]
  },
  {
    sentence: "A beggar sat near the station asking for spare change.",
    target: "beggar",
    answers: ["乞食"]
  },
  {
    sentence: "The warmth of the fire made everyone feel comfortable.",
    target: "warmth",
    answers: ["温もり"]
  },
  {
    sentence: "The government tried to stabilize the economy after the crisis.",
    target: "stabilize",
    answers: ["安定させる"]
  },
  {
    sentence: "Cows were grazing peacefully in the green meadow.",
    target: "meadow",
    answers: ["牧草地"]
  },
  {
    sentence: "The editor refused to water down the critical report.",
    target: "water down",
    answers: ["弱める"]
  },
  {
    sentence: "Children played near the fountain in the park center.",
    target: "fountain",
    answers: ["噴水"]
  },
  {
    sentence: "The factory will phase out outdated machines gradually.",
    target: "phase out",
    answers: ["段階的に廃止する"]
  },
  {
    sentence: "The ice became thin and dangerous during early spring.",
    target: "thin",
    answers: ["薄い"]
  },
  {
    sentence: "A replacement for the damaged part arrived in two days.",
    target: "replacement",
    answers: ["代替"]
  },
  {
    sentence: "The bird remained in a small cage inside the shop.",
    target: "cage",
    answers: ["鳥かご"]
  },
  {
    sentence: "She managed to get past the security guard unnoticed.",
    target: "get past",
    answers: ["通り抜ける"]
  },
  {
    sentence: "He is talented; what is more, he is hardworking.",
    target: "what is more",
    answers: ["その上"]
  },
  {
    sentence: "They sent an invitation to all guests for the wedding.",
    target: "invitation",
    answers: ["招待"]
  },
  {
    sentence: "The container was filled with imported goods from abroad.",
    target: "container",
    answers: ["容器"]
  },
  {
    sentence: "He felt jealous when his friend got a promotion.",
    target: "jealous",
    answers: ["嫉妬している"]
  },
  {
    sentence: "The museum displayed a marble statue from ancient Rome.",
    target: "marble",
    answers: ["大理石"]
  },
  {
    sentence: "A private tutor helped him improve his math scores.",
    target: "tutor",
    answers: ["家庭教師"]
  },
  {
    sentence: "The leaders hope to unite the community after conflict.",
    target: "unite",
    answers: ["団結する"]
  },
  {
    sentence: "His argument is in substance the same as the proposal.",
    target: "in substance",
    answers: ["実質的に"]
  }
    
  
  // 例: 複数正解対応
  // {
  //   sentence: "He is very smart.",
  //   target: "smart",
  //   answers: ["賢い", "頭がいい"],
  // },
];

/** 各問題に安定した ID（localStorage で「単語単位」を識別するため） */
const VOCAB_ITEMS = questions.map((q, i) => ({
  ...q,
  id: `w${i}`,
}));

const STORAGE_KEY = "vocab-progress";

/**
 * 習熟レベル（0〜5）
 * ベース: net = 正解数 − 不正解数。未チャレンジは 0。
 */
function masteryLevel(stat) {
  const c = stat?.correct ?? 0;
  const w = stat?.wrong ?? 0;
  const net = c - w;
  const attempts = c + w;
  if (attempts === 0) return 0;
  if (net <= -3) return 0;
  if (net <= 0) return 1;
  if (net <= 2) return 2;
  if (net <= 4) return 3;
  if (net <= 7) return 4;
  return 5;
}

/** Lv.1 以上の単語数（ダッシュボードの分子） */
function countLvAtLeast1(statsArr) {
  return statsArr.filter((s) => masteryLevel(s) >= 1).length;
}

/** 円グラフの帯・凡例で共通利用（Lv.1〜5 は習熟が上がるほど濃い緑系） */
const LEVEL_RING_COLORS = {
  0: "#d4d4d8",
  1: "#fef08a",
  2: "#fde047",
  3: "#a3e635",
  4: "#4ade80",
  5: "#15803d",
};

function buildMasteryConicGradient(levelCounts) {
  const total = levelCounts.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return `conic-gradient(from -90deg, ${LEVEL_RING_COLORS[0]} 0deg 360deg)`;
  }

  let angle = 0;
  const stops = [];
  for (let lv = 0; lv <= 5; lv++) {
    const sweep = (levelCounts[lv] / total) * 360;
    if (sweep <= 0) continue;
    stops.push(`${LEVEL_RING_COLORS[lv]} ${angle}deg ${angle + sweep}deg`);
    angle += sweep;
  }

  if (stops.length === 0) {
    return `conic-gradient(from -90deg, ${LEVEL_RING_COLORS[0]} 0deg 360deg)`;
  }

  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

/**
 * Lv.0〜5 を扇状に色分けしたドーナツ（conic-gradient）
 * 中央は Lv.1 以上の割合（従来どおり）
 */
function MasteryDonutChart({ levelCounts, lv1PlusPct }) {
  const clamped = Math.max(0, Math.min(100, lv1PlusPct));
  const ariaParts = [0, 1, 2, 3, 4, 5].map(
    (lv) =>
      `レベル${lv}が${levelCounts[lv]}語`,
  );
  const chartLabel = `習熟度の円グラフ。${ariaParts.join("。")}。Lv.1以上の割合は${Math.round(clamped)}パーセント。`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative inline-flex h-[152px] w-[152px] shrink-0 items-center justify-center"
        role="img"
        aria-label={chartLabel}
      >
        <div
          className="absolute inset-0 rounded-full shadow-sm transition-[background] duration-500"
          style={{
            background: buildMasteryConicGradient(levelCounts),
            WebkitMask:
              "radial-gradient(circle, transparent 52%, black calc(52% + 1px))",
            mask: "radial-gradient(circle, transparent 52%, black calc(52% + 1px))",
          }}
          aria-hidden
        />
        <div className="pointer-events-none relative z-10 text-center">
          <div className="text-2xl font-semibold tabular-nums text-emerald-900">
            {Math.round(clamped)}%
          </div>
          <div className="text-[11px] leading-tight text-zinc-500">
            Lv.1以上の割合
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-zinc-600">
        {[1, 2, 3, 4, 5].map((lv) => (
          <span key={lv} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-black/10"
              style={{ backgroundColor: LEVEL_RING_COLORS[lv] }}
              aria-hidden
            />
            Lv.{lv}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-black/10"
            style={{ backgroundColor: LEVEL_RING_COLORS[0] }}
            aria-hidden
          />
          Lv.0（未・苦手）
        </span>
      </div>
    </div>
  );
}

function ProgressDashboard({ stats, onBack }) {
  const totalWords = VOCAB_ITEMS.length;
  const lv1Plus = countLvAtLeast1(stats);
  const pct = totalWords === 0 ? 0 : (lv1Plus / totalWords) * 100;

  const levelCounts = [0, 1, 2, 3, 4, 5].map((lv) =>
    stats.filter((s) => masteryLevel(s) === lv).length,
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">進捗ダッシュボード</h1>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 items-center justify-center rounded-xl border bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            学習に戻る
          </button>
        </div>

        <p className="mt-2 text-sm text-zinc-600">
          全単語{" "}
          <span className="font-semibold tabular-nums">{totalWords}</span>{" "}
          語のうち、習熟 <span className="font-semibold">Lv.1 以上</span>{" "}
          （一度は正のネットスコアになった単語）が{" "}
          <span className="font-semibold tabular-nums">{lv1Plus}</span>{" "}
          語です。
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:items-start sm:justify-around">
          <MasteryDonutChart levelCounts={levelCounts} lv1PlusPct={pct} />

          <div className="w-full max-w-sm space-y-3">
            <h2 className="text-sm font-semibold text-zinc-800">
              レベル別の単語数
            </h2>
            <ul className="space-y-2 text-sm">
              {[5, 4, 3, 2, 1, 0].map((lv) => (
                <li
                  key={lv}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-zinc-600">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-black/10"
                      style={{ backgroundColor: LEVEL_RING_COLORS[lv] }}
                      aria-hidden
                    />
                    Lv.{lv}
                    {lv === 0 ? "（未・苦手）" : ""}
                  </span>
                  <span className="tabular-nums font-medium">
                    {levelCounts[lv]}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-zinc-500">
              Lv.は「正解−不正解」のネットに応じて 0〜5。未出題は Lv.0。
              英検学習では同じ問題に繰り返し答えるほどネットが上がります。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeAnswer(value) {
  return String(value ?? "")
    .normalize("NFKC") // 全角/半角などを寄せる
    .trim() // 要件: 空白除去
    .replace(/\s+/g, "") // 余分な空白ゆれ吸収（"悪 影響 のある" など）
    .toLowerCase(); // 英字が混ざっても大小ゆれ吸収
}

function renderSentenceWithTarget(sentence, target) {
  const idx = sentence.indexOf(target);
  if (idx === -1) return <span>{sentence}</span>;

  const before = sentence.slice(0, idx);
  const match = sentence.slice(idx, idx + target.length);
  const after = sentence.slice(idx + target.length);

  return (
    <span>
      {before}
      <span className="font-bold underline underline-offset-4">{match}</span>
      {after}
    </span>
  );
}

function getPraiseMessage(streak) {
  if (streak >= 9 && streak <= 10) {
    return { label: "MARVELOUS!!!", color: "text-red-600" };
  }
  if (streak >= 7 && streak <= 8) {
    return { label: "AMAZING!!", color: "text-violet-600" };
  }
  if (streak >= 5 && streak <= 6) {
    return { label: "EXCELLENT!", color: "text-blue-600" };
  }
  if (streak >= 3 && streak <= 4) {
    return { label: "GOOD", color: "text-sky-400" };
  }
  return null;
}

// priority = wrong / (correct + 1)
function calcPriority(stat) {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  return wrong / (correct + 1);
}

function pickRandomIndex(indices) {
  return indices[Math.floor(Math.random() * indices.length)];
}

export default function Page() {
  // 出題設定
  const PLAY_LIMIT = 10;

  /** study = クイズ画面 / dashboard = 進捗 */
  const [activeView, setActiveView] = useState("study");

  const pickRandomAnyQuestionIndex = () => {
    const n = VOCAB_ITEMS.length;
    if (n <= 1) return 0;
    return Math.floor(Math.random() * n);
  };

  // 問題別の正誤（VOCAB_ITEMS と同じ長さの配列）
  const [stats, setStats] = useState(() =>
    VOCAB_ITEMS.map(() => ({ correct: 0, wrong: 0 })),
  );

  // localStorage復元が完了したか（無限ループ/上書きを防ぐ）
  const didLoadFromStorageRef = useRef(false);

  // スコアリング
  const [score, setScore] = useState(0);
  // total = 現在の問題番号（1〜10）
  const [total, setTotal] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // 出題状態
  // SSR/CSRで初回描画を一致させる（hydration mismatch対策）
  const [index, setIndex] = useState(0);
  // 1プレイ内で同じ問題が出ないように記録（再レンダリング不要なのでrefでOK）
  const seenInPlayRef = useRef(null);
  if (seenInPlayRef.current === null) {
    seenInPlayRef.current = new Set([index]);
  }
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const resultReadyRef = useRef(false);

  const q = VOCAB_ITEMS[index];

  const normalizedAnswers = useMemo(() => {
    return (q?.answers ?? []).map(normalizeAnswer);
  }, [q]);

  // 初回マウント後にランダム出題へ切り替える（初回SSRと一致させた後でOK）
  useEffect(() => {
    const initial = pickRandomAnyQuestionIndex();
    setIndex(initial);
    seenInPlayRef.current = new Set([initial]);
  }, []);

  // 起動時にlocalStorageから学習履歴を復元（壊れていたら無視）
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage) return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        didLoadFromStorageRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        didLoadFromStorageRef.current = true;
        return;
      }

      // targetをキーにしてマージする
      const map = new Map();
      for (const item of parsed) {
        if (!item || typeof item !== "object") continue;
        const correct = Number(item.correct);
        const wrong = Number(item.wrong);
        const safe = {
          correct: Number.isFinite(correct) && correct >= 0 ? correct : 0,
          wrong: Number.isFinite(wrong) && wrong >= 0 ? wrong : 0,
        };
        if (typeof item.id === "string") {
          map.set(item.id, safe);
          continue;
        }
        // 以前の保存形式（target のみ）との互換
        const target = item.target;
        if (typeof target === "string") {
          const idx = VOCAB_ITEMS.findIndex((v) => v.target === target);
          if (idx >= 0) map.set(VOCAB_ITEMS[idx].id, safe);
        }
      }

      setStats((prev) =>
        VOCAB_ITEMS.map((v, i) => {
          const saved = map.get(v.id);
          const base = prev[i] ?? { correct: 0, wrong: 0 };
          return saved ? { correct: saved.correct, wrong: saved.wrong } : base;
        }),
      );
    } catch {
      // JSONが壊れている等は無視して初期化のまま
    } finally {
      didLoadFromStorageRef.current = true;
    }
  }, []);

  // 回答後の更新をlocalStorageへ保存（statsが変わったら保存）
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage) return;
    if (!didLoadFromStorageRef.current) return;

    try {
      const payload = VOCAB_ITEMS.map((v, i) => ({
        id: v.id,
        target: v.target,
        correct: stats[i]?.correct ?? 0,
        wrong: stats[i]?.wrong ?? 0,
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 保存できない環境（容量不足等）は黙って無視
    }
  }, [stats]);

  if (!q) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border bg-white p-6">
          <h1 className="text-xl font-semibold">英単語クイズ</h1>
          <p className="mt-3 text-zinc-700">問題データがありません。</p>
        </div>
      </div>
    );
  }

  if (activeView === "dashboard") {
    return (
      <ProgressDashboard stats={stats} onBack={() => setActiveView("study")} />
    );
  }

  const progress = `${total} / ${PLAY_LIMIT}`;
  const progressPct = Math.max(0, Math.min(100, (total / PLAY_LIMIT) * 100));

  const pickNextQuestionIndex = (avoidIndex, seenSet) => {
    const n = VOCAB_ITEMS.length;
    if (n <= 1) return 0;

    // すでに出た問題を除外（1プレイ内で重複させない）
    const remaining = Array.from({ length: n }, (_, i) => i).filter(
      (i) => !seenSet?.has(i),
    );
    if (remaining.length === 0) return null;

    const useWeakness = Math.random() < 0.7;

    // 70%: priority高めの問題からランダム
    if (useWeakness) {
      const ranked = remaining
        .sort((a, b) => calcPriority(stats[b]) - calcPriority(stats[a]));

      // 上位30%（最低1問）からランダム抽出
      const topK = Math.max(1, Math.ceil(ranked.length * 0.3));
      let pool = ranked.slice(0, topK);
      if (typeof avoidIndex === "number" && pool.length > 1) {
        pool = pool.filter((i) => i !== avoidIndex);
      }
      return pickRandomIndex(pool);
    }

    // 30%: 全体からランダム
    let pool = remaining;
    if (typeof avoidIndex === "number" && pool.length > 1) {
      pool = pool.filter((i) => i !== avoidIndex);
    }
    return pickRandomIndex(pool);
  };

  const checkAnswer = () => {
    // 二重加算防止
    if (checked || showResult) return;

    const user = normalizeAnswer(input);
    const ok = normalizedAnswers.includes(user);
    setIsCorrect(ok);
    setChecked(true);

    // 問題別 correct / wrong 更新（immutable）
    setStats((prev) => {
      const next = [...prev];
      const cur = next[index] ?? { correct: 0, wrong: 0 };
      next[index] = ok
        ? { correct: cur.correct + 1, wrong: cur.wrong }
        : { correct: cur.correct, wrong: cur.wrong + 1 };
      return next;
    });

    // スコアリング更新（totalは「次へ」で増やす）
    if (ok) {
      setScore((s) => s + 1);
      setStreak((st) => {
        const nextStreak = st + 1;
        setBestStreak((best) => Math.max(best, nextStreak));
        return nextStreak;
      });
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    if (!checked || showResult) return;

    // 10問目を終えたら結果表示（totalは10/10のまま）
    if (total >= PLAY_LIMIT) {
      setShowResult(true);
      return;
    }

    // 次の問題に切り替わったタイミングで問題番号を+1
    setTotal((t) => t + 1);

    const nextIndex = pickNextQuestionIndex(index, seenInPlayRef.current);
    if (nextIndex === null) {
      // 未出題がもう無い場合（問題数が少ない等）
      setShowResult(true);
      return;
    }
    seenInPlayRef.current.add(nextIndex);
    setIndex(nextIndex);
    setInput("");
    setChecked(false);
    setIsCorrect(false);
  };

  const restart = () => {
    setScore(0);
    setTotal(1);
    setStreak(0);
    setBestStreak(0);
    // 累積の正解・不正解は localStorage に残すため、ここでは stats はリセットしない
    const newIndex = pickRandomAnyQuestionIndex();
    setIndex(newIndex);
    seenInPlayRef.current = new Set([newIndex]);
    setInput("");
    setChecked(false);
    setIsCorrect(false);
    setShowResult(false);
  };

  useEffect(() => {
    if (!showResult) {
      resultReadyRef.current = false;
      return;
    }

    // 結果画面を表示してから、Enter 再開を有効にする
    resultReadyRef.current = false;
    const timeout = window.setTimeout(() => {
      resultReadyRef.current = true;
    }, 50);

    const handleKeyDown = (event) => {
      if (event.key !== "Enter") return;
      if (!resultReadyRef.current) return;
      restart();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showResult, restart]);

  if (showResult) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-xl font-semibold">結果</h1>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowResult(false);
                  setActiveView("dashboard");
                }}
                className="inline-flex h-9 items-center justify-center rounded-xl border bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                進捗ダッシュボード
              </button>
              <div className="text-sm text-zinc-500">
                Score: {score} / {PLAY_LIMIT}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-zinc-50 p-4">
            <div className="text-lg leading-8">
              最終スコア: <span className="font-semibold">{score}</span> /{" "}
              {PLAY_LIMIT}
            </div>
            <div className="mt-2 text-sm text-zinc-600">最高ストリーク: {bestStreak}</div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={restart}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-800"
            >
              もう一度（10問）
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">英単語クイズ</h1>
          <div className="flex flex-wrap items-center justify-end gap-3">
              <div
              className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200"
              role="progressbar"
              aria-label="progress"
              aria-valuenow={total}
              aria-valuemin={1}
              aria-valuemax={PLAY_LIMIT}
            >
              <div
                className="h-full rounded-full bg-zinc-900 transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="text-xs tabular-nums text-zinc-500">{progress}</div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-zinc-600">
          <div>
            Score: {score} / {PLAY_LIMIT}
          </div>
          <div className="inline-flex items-center gap-2">
            <span>最高ストリーク: {bestStreak}</span>
            {checked && isCorrect && getPraiseMessage(streak) && (
              <span
                className={`text-sm font-medium ${getPraiseMessage(streak).color}`}
              >
                {getPraiseMessage(streak).label}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-zinc-50 p-4">
          <div className="text-lg leading-8">
            {renderSentenceWithTarget(q.sentence, q.target)}
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-zinc-700">
            太字＋下線の単語の日本語訳
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-zinc-900/10"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (checked) next();
              else checkAnswer();
            }}
          />

          {checked && (
            <div className="mt-3">
              {isCorrect ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                  <div className="text-base font-semibold">正解！</div>
                </div>
              ) : (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
                  不正解。正解例: {normalizedAnswers.join(" / ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={checkAnswer}
            disabled={checked}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-800"
          >
            答え合わせ
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!checked}
            className="inline-flex h-11 items-center justify-center rounded-xl border px-5 font-medium text-zinc-900 hover:bg-zinc-50"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}

