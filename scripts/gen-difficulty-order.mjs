/**
 * lib/vocab/difficultyOrder.ts と docs/vocab-difficulty.csv を生成する。
 *
 * 出題順（＝段階的アンロックの順序）を、外部の一般的な指標にもとづいて
 * 易しい語から並べ直すための序列表を作る。LLM の主観で並べるのではなく、
 * 公開データ2種を機械的に合成する。
 *
 *   1. CEFR レベル
 *      - CEFR-J Vocabulary Profile 1.5 (A1-B2)
 *      - Octanove Vocabulary Profile C1/C2 1.0
 *        https://github.com/openlanguageprofiles/olp-en-cefrj (CC BY-SA 4.0)
 *   2. 頻度順位
 *      - FrequencyWords 2018 en_50k（OpenSubtitles コーパス由来）
 *        https://github.com/hermitdave/FrequencyWords (MIT)
 *
 *   3. 収録判定の裏取り（順位は使わず、載っているかだけを見る）
 *      - google-10000-english（一般ウェブコーパス由来）
 *        https://github.com/first20hours/google-10000-english
 *
 * 序列は CEFR バンドを主軸に、バンド内の並べ替えには「出る順」
 * （英語漬け.com の英検準1級プールにおける元の収録順）を使う。
 * 元データは出る順に並んでおり、CEFR にも一般頻度表にも無い情報
 * （英検準1級での出題頻度）を持つため、バンド内タイブレークとしては
 * 汎用の字幕コーパス頻度より優先する。
 * CEFR は本アプリの語彙の約5割しか収録していないため、未収録語のバンドは
 * 両方が判明している語から作った「頻度帯 → 平均CEFRバンド」の対応表で
 * 補完する（このバンド推定にのみ字幕コーパス頻度を使う）。字幕コーパス
 * 特有の偏り（lieutenant / colonel など）は、CEFR にも一般ウェブ頻度表にも
 * 載らない語への加点で打ち消す。
 *
 * 使い方: npx tsx scripts/gen-difficulty-order.mjs
 * （ネットワークから元データを取得する。生成物はコミットするので
 *   ビルド・テスト時にネットワークは不要）
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { VOCAB_ITEMS } from "../lib/vocab/index.ts";

// ── 合成パラメータ（すべてここに集約する）────────────────────────────────
/**
 * CEFRバンドを主軸に、出る順（元データの収録順）をバンド内の並べ替えに使う。
 * 動かせる幅を1バンド未満に抑えることで、
 * 「出る順は早いが学習段階としては上の語」がバンドを飛び越えないようにする。
 */
const EXAM_ORDER_WITHIN_BAND = 0.9;
/** 頻度表（50k）に無い語の扱い。実際に稀な語なので最難関帯へ寄せる */
const MISSING_FREQ_RANK = 60000;
/**
 * 複合語・イディオムへの加点。`end up` のように構成語が超高頻度でも
 * 意味は非自明で、構成語の頻度だけでは易しく見積もりすぎる。
 */
const PHRASE_PENALTY = 0.6;
/** 頻度帯 → 平均CEFRバンドの対応表を作るときのビン数 */
const IMPUTE_BINS = 24;
/**
 * CEFR表に無い語への加点。CEFR-J + Octanove の和集合は A1〜C2 の
 * 学習語彙 約9,900見出しを覆う。そこに載っていない語は
 * 「標準的な学習語彙の外」であり、字幕コーパスで頻度が高くても
 * 入門段階に置くべきではない（lieutenant / colonel / sergeant など、
 * 字幕コーパス特有の偏りを打ち消す役割も兼ねる）。
 * ただし一般的なウェブ頻度表（google-10k）にも載る語は
 * 「単にCEFR表の収録漏れ」とみなして加点しない。
 */
const UNLISTED_PENALTY = 1.0;

const SOURCES = {
  cefrj: "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv",
  octanove: "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/octanove-vocabulary-profile-c1c2-1.0.csv",
  freq: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt",
  webFreq: "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt",
};

const CEFR_BANDS = ["A1", "A2", "B1", "B2", "C1", "C2"];

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function parseCsv(text) {
  return text
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const cells = [];
      let cur = "";
      let quoted = false;
      for (const ch of line) {
        if (ch === '"') quoted = !quoted;
        else if (ch === "," && !quoted) {
          cells.push(cur);
          cur = "";
        } else cur += ch;
      }
      cells.push(cur);
      return cells;
    });
}

/** 短すぎる語幹（heed → he）を弾く下限 */
const MIN_STEM_LENGTH = 3;

/**
 * 語形変化の候補と、見出し語に期待する品詞。
 *
 * 品詞を伴わせるのは誤マッチを防ぐため。`heed`(verb) から `he`(pronoun)、
 * `ruling`(noun) から `rule`(verb)、`manly`(adjective) から `man`(noun) へ
 * 落ちると、無関係な易しい語のレベルを拾ってしまう。
 */
const INFLECTIONS = [
  // 複数形・三単現
  { pattern: /ies$/, replacement: "y", expect: ["noun", "verb"] },
  { pattern: /ves$/, replacement: "f", expect: ["noun", "verb"] },
  { pattern: /(ss|sh|ch|x|z|o)es$/, replacement: "$1", expect: ["noun", "verb"] },
  { pattern: /s$/, replacement: "", expect: ["noun", "verb"] },
  // 過去形・過去分詞（形容詞化した分詞も動詞の見出し語へ寄せる）
  { pattern: /ied$/, replacement: "y", expect: ["verb"] },
  { pattern: /(.)\1ed$/, replacement: "$1", expect: ["verb"] },
  { pattern: /ed$/, replacement: "", expect: ["verb"] },
  { pattern: /ed$/, replacement: "e", expect: ["verb"] },
  // 現在分詞・動名詞
  { pattern: /(.)\1ing$/, replacement: "$1", expect: ["verb"] },
  { pattern: /ing$/, replacement: "", expect: ["verb"] },
  { pattern: /ing$/, replacement: "e", expect: ["verb"] },
  // 比較級・最上級
  { pattern: /ier$/, replacement: "y", expect: ["adjective"] },
  { pattern: /est$/, replacement: "", expect: ["adjective"] },
  { pattern: /er$/, replacement: "", expect: ["adjective"] },
  // 形容詞からの副詞派生
  { pattern: /ally$/, replacement: "al", expect: ["adjective"] },
  { pattern: /ly$/, replacement: "", expect: ["adjective"] },
];

/** [語形, 期待する品詞（null = 何でもよい）] の候補列 */
function lemmaCandidates(word) {
  const candidates = [[word, null]];
  for (const { pattern, replacement, expect } of INFLECTIONS) {
    if (!pattern.test(word)) continue;
    const candidate = word.replace(pattern, replacement);
    if (candidate.length >= MIN_STEM_LENGTH) candidates.push([candidate, expect]);
  }
  return candidates;
}

/** 頻度表は品詞を持たないので語形だけで引く */
function lookupFreq(table, word) {
  for (const [candidate] of lemmaCandidates(word)) {
    const hit = table.get(candidate);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

/**
 * CEFRバンドを引く。完全一致なら品詞は問わない（本アプリの品詞表記と
 * CEFR表の品詞表記は必ずしも揃わないため）が、語形変化を経由した場合は
 * 期待する品詞の見出し語だけを受け付ける。
 */
function lookupCefr(table, word, partOfSpeech) {
  for (const [candidate, expect] of lemmaCandidates(word)) {
    const entries = table.get(candidate);
    if (!entries) continue;
    const usable = expect
      ? entries.filter((e) => expect.includes(e.pos))
      : entries.filter((e) => e.pos === partOfSpeech);
    const pool = usable.length > 0 ? usable : expect ? [] : entries;
    if (pool.length > 0) return Math.min(...pool.map((e) => e.band));
  }
  return undefined;
}

async function main() {
  const [cefrjCsv, octanoveCsv, freqTxt, webFreqTxt] = await Promise.all([
    fetchText(SOURCES.cefrj),
    fetchText(SOURCES.octanove),
    fetchText(SOURCES.freq),
    fetchText(SOURCES.webFreq),
  ]);

  // CEFR: 見出し語ごとに [品詞, バンド] を全て持つ（品詞で絞り込めるように）
  const cefrByWord = new Map();
  for (const csv of [cefrjCsv, octanoveCsv]) {
    for (const [headword, pos, level] of parseCsv(csv)) {
      if (!headword || !level) continue;
      const band = CEFR_BANDS.indexOf(level.trim());
      if (band < 0) continue;
      // 「a.m./A.M./am/AM」のようなスラッシュ区切りの異形を展開する
      for (const variant of headword.split("/")) {
        const key = variant.trim().toLowerCase();
        if (!key) continue;
        if (!cefrByWord.has(key)) cefrByWord.set(key, []);
        cefrByWord.get(key).push({ pos: (pos ?? "").trim(), band });
      }
    }
  }

  const freqByWord = new Map();
  freqTxt
    .trim()
    .split("\n")
    .forEach((line, i) => {
      const word = line.split(" ")[0];
      if (word && !freqByWord.has(word)) freqByWord.set(word, i + 1);
    });

  // CEFR未収録語が「収録漏れ」なのか「学習語彙の外」なのかを判定するための
  // 別コーパス（一般ウェブ）。順位そのものは使わず、載っているかだけを見る。
  const webFreqWords = new Set(
    webFreqTxt
      .trim()
      .split("\n")
      .map((w) => w.trim())
      .filter(Boolean),
  );

  const maxLogRank = Math.log10(MISSING_FREQ_RANK);
  /** 頻度順位を 0（最頻）〜1（最難）の連続値へ */
  const toFreqScore = (rank) => Math.log10(Math.max(1, rank)) / maxLogRank;

  /** CEFR収録の複合語の平均バンド。複合語の下限として使う（実測値） */
  const phraseFloor = (() => {
    const bands = [];
    for (const [word, entries] of cefrByWord) {
      if (/\s/.test(word)) bands.push(Math.min(...entries.map((e) => e.band)));
    }
    return bands.reduce((a, b) => a + b, 0) / bands.length;
  })();

  // ── 各語の生データを集める ────────────────────────────────────────────
  // VOCAB_ITEMS の配列順＝英語漬け.com の英検準1級プールの収録順（出る順）。
  // basic.ts → advanced.ts の連結順がそのまま出る順になっている。
  const rows = VOCAB_ITEMS.map((item, examOrder) => {
    const target = item.target.toLowerCase();
    const isPhrase = /[ '-]/.test(target);
    const parts = isPhrase ? target.split(/[\s'-]+/).filter(Boolean) : [target];

    // 複合語は「最も珍しい構成語」で見積もる（一番難しい部分が理解を律速する）
    let freqRank = lookupFreq(freqByWord, target);
    if (freqRank === undefined && isPhrase) {
      const partRanks = parts.map((p) => lookupFreq(freqByWord, p) ?? MISSING_FREQ_RANK);
      freqRank = Math.max(...partRanks);
    }
    if (freqRank === undefined) freqRank = MISSING_FREQ_RANK;

    // 複合語は構成語からバンドを推定しない。`get on with` のように
    // 構成語が全て A1 でも意味は非自明で、A1 と見積もるのは誤りになる。
    const cefr = lookupCefr(cefrByWord, target, item.partOfSpeech);
    const inWebFreq = parts.every((p) => webFreqWords.has(p));

    return {
      item,
      isPhrase,
      freqRank,
      cefr,
      inWebFreq,
      freqScore: toFreqScore(freqRank),
      examOrder,
      // [0, 1) に収める（1 に達すると次の整数バンドと衝突しうるため）
      examScore: examOrder / VOCAB_ITEMS.length,
    };
  });

  // ── CEFR 未収録語のバンドを頻度から補完する ──────────────────────────
  // 両方わかっている語で「頻度帯 → 平均CEFRバンド」を作り、単調になるよう
  // 累積最大を取ってから線形補間する。
  const bins = Array.from({ length: IMPUTE_BINS }, () => []);
  const binOf = (freqScore) =>
    Math.min(IMPUTE_BINS - 1, Math.max(0, Math.floor(freqScore * IMPUTE_BINS)));
  for (const row of rows) {
    if (row.cefr !== undefined) bins[binOf(row.freqScore)].push(row.cefr);
  }
  const binMeans = [];
  let running = 0;
  for (const [i, values] of bins.entries()) {
    const mean =
      values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : binMeans[i - 1] ?? running;
    running = Math.max(running, mean); // 頻度が下がるほど難しい、を崩さない
    binMeans.push(running);
  }
  const imputeCefr = (freqScore) => binMeans[binOf(freqScore)];

  // ── スコア確定 ────────────────────────────────────────────────────────
  for (const row of rows) {
    row.imputed = row.cefr === undefined;

    let band = row.imputed ? imputeCefr(row.freqScore) : row.cefr;
    // CEFR表にも一般ウェブ頻度表にも無い語は、字幕コーパスで頻度が高くても
    // 学習語彙の外とみなす
    if (row.imputed && !row.inWebFreq) band += UNLISTED_PENALTY;
    // 複合語は構成語がどれだけ易しくても、CEFR収録の複合語の平均バンドを下限にする
    if (row.isPhrase) band = Math.max(band, phraseFloor) + PHRASE_PENALTY;

    row.cefrBand = band;
    // 整数バンドを主軸に、バンド内は出る順の小数部で並べる。
    // examScore は [0, 1) に収まるため、どんな値でも整数バンドをまたがない
    // （継続値の band に freqScore を線形合成していた旧実装は、頻度が
    // 難易度と緩く相関する前提に依存していた。出る順は難易度と無相関
    // ―― 試験に出る語ほど難語なことも多い ―― なので、同じやり方で
    // 合成するとバンド境界を平気で飛び越えてしまう。整数バンドで
    // 主軸を固定することで、境界を壊さずに出る順を主要な並べ替え軸にする）
    //
    // 複合語・イディオムだけは従来どおり freqScore で並べる。出る順は
    // 単語の難易度と無相関なので、複合語がこれで先頭付近に出ると
    // 入門帯にイディオムが混入してしまう（PHRASE_PENALTY /
    // phraseFloor が守ろうとしている「複合語は入門帯に置かない」を崩す）。
    const withinBand = row.isPhrase ? row.freqScore : row.examScore;
    row.score = Math.trunc(band) + EXAM_ORDER_WITHIN_BAND * withinBand;
  }

  // 同点は決定的に解く（出る順 → ID 辞書順）。再生成しても順序がぶれないように。
  rows.sort(
    (a, b) =>
      a.score - b.score ||
      a.examOrder - b.examOrder ||
      a.item.id.localeCompare(b.item.id),
  );

  const here = dirname(fileURLToPath(import.meta.url));
  const generatedAt = new Date().toISOString().slice(0, 10);

  const header = `// 自動生成: npx tsx scripts/gen-difficulty-order.mjs (${generatedAt})
//
// 出題順（段階的アンロックの順序）。易しい語から並んでいる。
// CEFR バンドを主軸に、バンド内は出る順（英語漬け.com の英検準1級プールの
// 元の収録順）で並べる。LLM の主観は入っていない。
//
//   - CEFR: CEFR-J Vocabulary Profile 1.5 / Octanove Vocabulary Profile C1-C2 1.0
//           https://github.com/openlanguageprofiles/olp-en-cefrj (CC BY-SA 4.0)
//   - 頻度: FrequencyWords 2018 en_50k (OpenSubtitles)
//           ※ CEFR未収録語のバンド推定にのみ使用。バンド内の並べ替えには
//           使わない（出る順の方が英検準1級への関連度が高いため）
//           https://github.com/hermitdave/FrequencyWords (MIT)
//
// 合成の内訳（CEFRレベル・出る順・スコア）は docs/vocab-difficulty.csv に
// 全語分を出力してある。語彙を追加したら生成スクリプトを再実行すること。
// 未知のIDは lib/vocab/index.ts 側で末尾に回るため、再生成し忘れても壊れない。

/** 安定IDを易しい順に並べたもの */
export const DIFFICULTY_ORDER: readonly string[] = [
`;
  const body = rows.map((r) => `  ${JSON.stringify(r.item.id)},`).join("\n");
  writeFileSync(join(here, "..", "lib", "vocab", "difficultyOrder.ts"), `${header}${body}\n];\n`);

  const csv = [
    "order,id,target,partOfSpeech,cefr,effectiveBand,freqRank,examOrder,isPhrase,score",
    ...rows.map((r, i) =>
      [
        i,
        r.item.id,
        JSON.stringify(r.item.target),
        JSON.stringify(r.item.partOfSpeech),
        r.imputed ? "" : CEFR_BANDS[r.cefr],
        r.cefrBand.toFixed(2),
        r.freqRank >= MISSING_FREQ_RANK ? "" : r.freqRank,
        r.examOrder,
        r.isPhrase ? "1" : "",
        r.score.toFixed(4),
      ].join(","),
    ),
  ].join("\n");
  writeFileSync(join(here, "..", "docs", "vocab-difficulty.csv"), `${csv}\n`);

  // ── 生成結果の要約 ────────────────────────────────────────────────────
  const known = rows.filter((r) => !r.imputed);
  const withFreq = rows.filter((r) => r.freqRank < MISSING_FREQ_RANK).length;

  // 品質の客観指標: CEFRが判明している語について、生成した序列と
  // CEFRバンドの順位相関（スピアマン）。1に近いほどCEFRに沿っている。
  const spearman = (() => {
    const sample = known.map((r, i) => ({ our: rows.indexOf(r), cefr: r.cefr, i }));
    const rankOf = (values) => {
      const sorted = [...values].sort((a, b) => a - b);
      return values.map((v) => sorted.indexOf(v) + 1);
    };
    const x = rankOf(sample.map((s) => s.our));
    const y = rankOf(sample.map((s) => s.cefr));
    const n = x.length;
    const mean = (a) => a.reduce((s, v) => s + v, 0) / n;
    const [mx, my] = [mean(x), mean(y)];
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - mx) * (y[i] - my);
      dx += (x[i] - mx) ** 2;
      dy += (y[i] - my) ** 2;
    }
    return num / Math.sqrt(dx * dy);
  })();

  console.log(`words: ${rows.length}`);
  console.log(`CEFR direct: ${known.length} (${((known.length / rows.length) * 100).toFixed(1)}%)`);
  console.log(`freq hit:    ${withFreq} (${((withFreq / rows.length) * 100).toFixed(1)}%)`);
  console.log(`phrase floor (CEFR収録複合語の平均バンド): ${phraseFloor.toFixed(2)}`);
  console.log(`Spearman(序列, CEFRバンド) = ${spearman.toFixed(3)}`);

  const head = rows.slice(0, 60);
  const headBands = {};
  for (const r of head) {
    const key = r.imputed ? `~${CEFR_BANDS[Math.round(r.cefrBand)]}` : CEFR_BANDS[r.cefr];
    headBands[key] = (headBands[key] ?? 0) + 1;
  }
  console.log("\n先頭60語のCEFR内訳:", headBands);
  console.log(
    head
      .map((r, i) => `${String(i + 1).padStart(2)}. ${r.item.target} (${r.imputed ? "~" : ""}${CEFR_BANDS[Math.round(r.cefrBand)]})`)
      .join("\n"),
  );
  console.log("\n末尾10語:", rows.slice(-10).map((r) => r.item.target).join(", "));
}

await main();
