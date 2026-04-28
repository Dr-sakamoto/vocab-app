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
    target: "map out",
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
  // 例: 複数正解対応
  // {
  //   sentence: "He is very smart.",
  //   target: "smart",
  //   answers: ["賢い", "頭がいい"],
  // },
];

const STORAGE_KEY = "vocab-progress";

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

  const pickRandomAnyQuestionIndex = () => {
    const n = questions.length;
    if (n <= 1) return 0;
    return Math.floor(Math.random() * n);
  };

  // 問題別の正誤（questions自体は触らず、別stateで持つ）
  const [stats, setStats] = useState(() =>
    questions.map(() => ({ correct: 0, wrong: 0 })),
  );

  // localStorage復元が完了したか（無限ループ/上書きを防ぐ）
  const didLoadFromStorageRef = useRef(false);

  // スコアリング
  const [score, setScore] = useState(0);
  // total = 現在の問題番号（1〜10）
  const [total, setTotal] = useState(1);
  const [streak, setStreak] = useState(0);

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

  const q = questions[index];

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
        const target = item.target;
        if (typeof target !== "string") continue;
        const correct = Number(item.correct);
        const wrong = Number(item.wrong);
        map.set(target, {
          correct: Number.isFinite(correct) && correct >= 0 ? correct : 0,
          wrong: Number.isFinite(wrong) && wrong >= 0 ? wrong : 0,
        });
      }

      setStats((prev) =>
        questions.map((q, i) => {
          const saved = map.get(q.target);
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
      const payload = questions.map((q, i) => ({
        target: q.target,
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

  const progress = `${total} / ${PLAY_LIMIT}`;
  const progressPct = Math.max(0, Math.min(100, (total / PLAY_LIMIT) * 100));

  const pickNextQuestionIndex = (avoidIndex, seenSet) => {
    const n = questions.length;
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
      setStreak((st) => st + 1);
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
    setStats(questions.map(() => ({ correct: 0, wrong: 0 })));
    const newIndex = pickRandomAnyQuestionIndex();
    setIndex(newIndex);
    seenInPlayRef.current = new Set([newIndex]);
    setInput("");
    setChecked(false);
    setIsCorrect(false);
    setShowResult(false);
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-xl font-semibold">結果</h1>
            <div className="text-sm text-zinc-500">
              Score: {score} / {PLAY_LIMIT}
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-zinc-50 p-4">
            <div className="text-lg leading-8">
              最終スコア: <span className="font-semibold">{score}</span> /{" "}
              {PLAY_LIMIT}
            </div>
            <div className="mt-2 text-sm text-zinc-600">Streak: {streak}</div>
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
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-semibold">英単語クイズ</h1>
          <div className="flex items-center gap-3">
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

        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600">
          <div>
            Score: {score} / {PLAY_LIMIT}
          </div>
          <div>Streak: {streak}</div>
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
                  正解！
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

