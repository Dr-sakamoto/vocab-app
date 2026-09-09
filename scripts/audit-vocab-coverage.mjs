/**
 * docs/vocab-coverage-gaps.csv を生成する。
 *
 * 本アプリの語彙は単一の出典（英語漬け.com の英検準1級プール）に由来する。
 * 出典が持っていない語は、こちらも永久に持たない。収録語の質を見るだけでは
 * この抜けは見えないので、外部の学習語彙リストを基準に「入っていない語」を
 * 機械的に洗い出し、追加候補として残す。
 *
 * 基準に使う公開データは gen-difficulty-order.mjs と同じものを使う。
 * 序列生成と監査で基準がずれると、どちらの結果も信用できなくなる。
 *
 *   - CEFR-J Vocabulary Profile 1.5 (A1-B2)
 *   - Octanove Vocabulary Profile C1/C2 1.0
 *     https://github.com/openlanguageprofiles/olp-en-cefrj (CC BY-SA 4.0)
 *   - FrequencyWords 2018 en_50k（OpenSubtitles コーパス由来）
 *     https://github.com/hermitdave/FrequencyWords (MIT)
 *
 * これに加えて、学術・書き言葉のレジスタを絞り込むために語彙リスト2種を使う。
 * CEFRバンドと字幕頻度だけでは会話語と書き言葉を分けられなかったので、
 * 「学術文章に広く現れる語」という別の軸を足す。
 *
 *   - Academic Word List (Coxhead 2000) 570語族
 *   - New Academic Word List 1.2 (Browne, Culligan & Phillips) 963語族
 *     機械可読版 https://github.com/lpmi-13/machine_readable_wordlists (CC0 1.0)
 *     NAWL の原典は CC BY-SA 4.0 http://www.newgeneralservicelist.org/
 *
 * 頻度表が字幕コーパス由来である点に注意する。準1級の主戦場である
 * 書き言葉・学術語彙（scrutinize, permeate など）は会話では使われないため
 * 順位が低く出る。順位の低さは「不要な語」を意味しない。逆に順位が
 * 極端に高い語（rank 2000位以内）は会話の基本語で、準1級の受験者は
 * すでに知っている前提に立てる。この両側を tier で仕分ける。
 *
 * 出力は「追加候補の母集団」であって、優先順位表ではない。
 * 手元の公開データからは会話語と書き言葉のレジスタを機械的に分離できない
 * （google-10k は sexy/pa を含み perceive/abundant を含まないので、
 * この用途には使えなかった）。学術語彙リストとの交差はここをかなり絞るが、
 * それでも create / data / area のような既習の基本語が残る。AWL は
 * 「学術文章に頻出する語」であって「学習者が知らない語」ではないため。
 * そのため CSV には判断材料（CEFRバンド・頻度順位・学術リスト収録）を
 * 並べるだけにとどめ、実際に収録する語の選定は英検の出題実績にあたって
 * 人が決める。並び順は粗い目安でしかない。
 *
 * 使い方: npx tsx scripts/audit-vocab-coverage.mjs
 * （ネットワークから基準データを取得する。生成物はコミットするので
 *   ビルド・テスト時にネットワークは不要）
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { VOCAB_ITEMS } from "../lib/vocab/index.ts";

const SOURCES = {
  cefrj:
    "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv",
  octanove:
    "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/octanove-vocabulary-profile-c1c2-1.0.csv",
  freq: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt",
  awl: "https://raw.githubusercontent.com/lpmi-13/machine_readable_wordlists/master/Academic/AWL/AWL.json",
  nawl: "https://raw.githubusercontent.com/lpmi-13/machine_readable_wordlists/master/Academic/NAWL/NAWL.json",
};

const CEFR_BANDS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** 準1級の中心帯。ここの抜けが一番痛い */
const CORE_BANDS = new Set(["B2", "C1"]);
/** 2級までで既習、または1級寄り。参考として出すが優先度は落とす */
const EDGE_BANDS = new Set(["B1", "C2"]);
/** この順位より高頻度な語は会話の基本語。準1級では既知とみなす */
const ASSUMED_KNOWN_RANK = 2000;

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/** 引用符つきCSVの1行を分解する。基準データに改行入りセルは無い */
function splitCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += ch;
  }
  cells.push(cell);
  return cells;
}

/**
 * 見出し語 → CEFRバンド。
 * CEFR-J の見出しは `practise/practice` のように異形をスラッシュで束ねるので
 * ばらして全ての綴りを引けるようにする。同じ語が複数バンドに現れたら
 * 易しい方を採る（学習者が最初に出会う段階に合わせる）。
 */
function readCefrBands(texts) {
  const bands = new Map();
  for (const text of texts) {
    for (const line of text.trim().split("\n").slice(1)) {
      const [headword, , level] = splitCsvLine(line);
      if (!CEFR_BANDS.includes(level)) continue;
      for (const variant of headword.split("/")) {
        const word = variant.toLowerCase().trim();
        if (!word) continue;
        const prev = bands.get(word);
        if (prev === undefined || CEFR_BANDS.indexOf(level) < CEFR_BANDS.indexOf(prev)) {
          bands.set(word, level);
        }
      }
    }
  }
  return bands;
}

/**
 * 学術語彙リストの全語形 → リスト名。
 *
 * どちらのリストも語族単位（`analyse` に `analysed` `analysis` …）なので、
 * 派生形のどれで引いても当たるように展開する。AWL はサブリスト（頻度帯）で
 * 一段深い入れ子になっていて、NAWL は見出し語直下に語形が並ぶ。
 */
function readAcademicForms(awlJson, nawlJson) {
  const forms = new Map();
  const put = (word, list) => {
    const key = word.toLowerCase().trim();
    if (key && !forms.has(key)) forms.set(key, list);
  };
  for (const sublist of Object.values(awlJson)) {
    for (const [headword, entry] of Object.entries(sublist)) {
      put(headword, "AWL");
      for (const form of entry.subwords ?? []) put(form, "AWL");
    }
  }
  for (const [headword, subwords] of Object.entries(nawlJson)) {
    put(headword, "NAWL");
    for (const form of subwords ?? []) put(form, "NAWL");
  }
  return forms;
}

/**
 * 英綴りを対応する米綴りへ書き換える候補を返す。該当しなければ null。
 *
 * 基準リストは英米の綴りを別見出しで持つので、そのままだと
 * categorization と categorisation が2件の候補として並ぶ。本アプリの語彙は
 * 米綴り（scrutinize, localize, revitalize）で揃っているため、
 * 米綴りが実在する場合にかぎり英綴りのほうを候補から落とす。
 * 「変換して実在するか」を必ず確かめるので、pri{s→z}e のような誤爆はしない。
 */
function toAmericanSpelling(word) {
  const rules = [
    [/ise$/, "ize"],
    [/ised$/, "ized"],
    [/ising$/, "izing"],
    [/isation$/, "ization"],
    [/isations$/, "izations"],
    [/yse$/, "yze"],
    [/re$/, "er"],
    [/our$/, "or"],
  ];
  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) return word.replace(pattern, replacement);
  }
  return null;
}

/** 見出し語 → 頻度順位（1始まり）。重複見出しは最初の順位を採る */
function readFreqRanks(text) {
  const ranks = new Map();
  text
    .trim()
    .split("\n")
    .forEach((line, i) => {
      const word = line.split(" ")[0];
      if (word && !ranks.has(word)) ranks.set(word, i + 1);
    });
  return ranks;
}

async function main() {
  const [cefrj, octanove, freq, awl, nawl] = await Promise.all([
    fetchText(SOURCES.cefrj),
    fetchText(SOURCES.octanove),
    fetchText(SOURCES.freq),
    fetchText(SOURCES.awl),
    fetchText(SOURCES.nawl),
  ]);
  const bands = readCefrBands([cefrj, octanove]);
  const freqRanks = readFreqRanks(freq);
  const academic = readAcademicForms(JSON.parse(awl), JSON.parse(nawl));

  // 収録語の集合。句（`end up` など）は基準リストが単語単位なので比較に使わない
  const ours = new Set(VOCAB_ITEMS.map((item) => item.target.toLowerCase().trim()));
  const singleWords = [...ours].filter((w) => !w.includes(" "));

  // ── バンド別カバレッジ ──────────────────────────────────────────────
  const coverage = new Map(
    CEFR_BANDS.map((band) => [band, { total: 0, covered: 0 }]),
  );
  for (const [word, band] of bands) {
    const stat = coverage.get(band);
    stat.total += 1;
    if (ours.has(word)) stat.covered += 1;
  }

  // ── 未収録語 ────────────────────────────────────────────────────────
  const found = [];
  for (const [word, band] of bands) {
    if (ours.has(word)) continue;
    if (!CORE_BANDS.has(band) && !EDGE_BANDS.has(band)) continue; // A1/A2は既習
    const freqRank = freqRanks.get(word) ?? null;
    const assumedKnown = freqRank !== null && freqRank <= ASSUMED_KNOWN_RANK;
    const tier = CORE_BANDS.has(band) && !assumedKnown ? "core" : "edge";
    found.push({ word, band, freqRank, tier, academic: academic.get(word) ?? "" });
  }

  // 米綴りが候補にも語彙にもある英綴りは、同じ語の二重掲載なので落とす
  const candidates = new Set(found.map((g) => g.word));
  const gaps = found.filter((g) => {
    const american = toAmericanSpelling(g.word);
    return !american || !(candidates.has(american) || ours.has(american));
  });

  // 学術リストに載る語を先に、次に core。その中は頻度の低い順に並べる。
  // 学術リストに載っている時点で「学術文章に頻出する語」は保証されており、
  // そのうえで字幕コーパスでの頻度が低いほど会話では使われない書き言葉、
  // つまり学習者が知らない可能性が高い語になる。頻度表に無い語が先頭。
  // あくまで眺める順を決めるだけで、この順に追加してよいという意味ではない。
  gaps.sort((a, b) => {
    if (!!a.academic !== !!b.academic) return a.academic ? -1 : 1;
    if (a.tier !== b.tier) return a.tier === "core" ? -1 : 1;
    return (b.freqRank ?? Infinity) - (a.freqRank ?? Infinity);
  });

  const here = dirname(fileURLToPath(import.meta.url));
  const csv = [
    "rank,headword,cefr,freqRank,tier,academic",
    ...gaps.map((g, i) =>
      [i, `"${g.word}"`, g.band, g.freqRank ?? "", g.tier, g.academic].join(","),
    ),
  ].join("\n");
  writeFileSync(join(here, "..", "docs", "vocab-coverage-gaps.csv"), `${csv}\n`);

  // ── 結果の要約 ──────────────────────────────────────────────────────
  console.log(
    `収録: ${VOCAB_ITEMS.length}件（単語 ${singleWords.length} / 句 ${VOCAB_ITEMS.length - singleWords.length}）`,
  );
  console.log(`基準の学習語彙: ${bands.size}語\n`);
  console.log("band  基準語数   収録   カバー率");
  for (const band of CEFR_BANDS) {
    const { total, covered } = coverage.get(band);
    if (!total) continue;
    console.log(
      band.padEnd(5),
      String(total).padStart(8),
      String(covered).padStart(6),
      `${((covered / total) * 100).toFixed(1).padStart(7)}%`,
    );
  }
  const core = gaps.filter((g) => g.tier === "core");
  const academicGaps = gaps.filter((g) => g.academic);
  const academicCore = academicGaps.filter((g) => g.tier === "core");
  console.log(`\n未収録 ${gaps.length}語（core ${core.length} / edge ${gaps.length - core.length}）`);
  console.log(
    `うち学術語彙リスト収録 ${academicGaps.length}語（core ${academicCore.length}）` +
      ` ← レビュー対象はここまで絞れる`,
  );
  console.log("学術リスト×core 先頭40語:", academicCore.slice(0, 40).map((g) => g.word).join(", "));
  console.log(
    "\n※ これは追加候補の母集団であって優先順位表ではない。字幕コーパス由来の" +
      "頻度順位には会話語への偏りがあり、学術リストで絞ってもなお create / data の" +
      "ような既習の基本語が残る。収録の可否は英検の出題実績にあたって判断する。",
  );
}

await main();
