/**
 * モンスター非遭遇時にミッション欄へ流すフレーバーテキスト。
 * 「システムTips」（全エリア共通・ゲームの遊び方を直接説明する）と、
 * 現在地（生息地）ごとの世界観フレーバーを1つのプールに混ぜてローテーションする。
 * 2問正解するごとに表示を切り替える。
 *
 * システムTipsは遠回しな比喩を避け、率直でわかりやすい言い方にする。
 * エリアフレーバーは学習・勉強を連想させる言葉や、未実装のストーリー設定
 * （固有名詞の伝承等）を持ち込まず、地形・雰囲気を簡潔に描写するだけに留める。
 */

/**
 * 全エリア共通。ゲームの仕組み（ミッション・捕獲・HP・手持ち・連続正解など）を
 * そのまま直接説明する攻略Tips。
 */
export const SYSTEM_TIPS: readonly string[] = [
  "強いエティモンほど、達成すべきミッションの数も多くなる。",
  "「苦手な単語」ミッションは、間違えたことのある単語に正解すると進む。",
  "「新出単語」ミッションは、まだ挑戦したことのない単語に正解すると進む。",
  "連続で正解し続けるほど、ストリークミッションの達成に近づく。",
  "対象のエティモンを手持ちに入れて正解すると、指定ミッションが進む。",
  "レベルの高いエティモンを手持ちに入れておくと、レベル指定ミッションを達成しやすい。",
  "正解するたびに相手のHPが減っていく。ミッションを全部達成すれば捕獲できる。",
  "HPが0になる前にミッションを達成できないと、捕まえられずに逃げられてしまう。",
  "手持ちの数やレベルが高いほど、1回の正解で与えるダメージが大きくなる。",
  "手持ちが強いほどHPは早く減る。捕獲までの猶予を残すには、あえて弱い手持ちで挑む手もある。",
  "毎日プレイを続けると、連続日数が記録されていく。",
];

/**
 * 生息地IDごとの世界観フレーバー。lib/capture.ts の HABITATS と対応する。
 * WORLD_MAP.md の地理canonに沿った、地形・雰囲気の簡潔な説明のみ。
 * 未実装のストーリー設定（固有の伝承・事件）はここに含めない。
 */
export const AREA_FLAVOR_TIPS: Readonly<Record<string, readonly string[]>> = {
  elmuria: [
    "エルムリアは、北の滝の水に育まれた古く広大な森。",
    "生い茂る木々の中では、時々小さな生き物の気配がする。",
  ],
  everstep: [
    "エバーステップは、緑豊かでなだらかな大草原。",
    "風が草を揺らし、遠くまで見晴らせる開けた土地。",
  ],
  "apple-town": [
    "アップルタウンは、牧場とりんごの木々に囲まれたのどかな町。",
    "多くの旅が、この町から始まる。",
  ],
  "old-smoke": [
    "オールドスモークは、霧深く危険な底なしの湿地帯。",
    "濃い霧のせいで、少し先も見通せない。",
  ],
  "kapadra-cave": [
    "カパドラ洞窟は、地底へと続く巨大な縦穴。",
    "この先に地下帝国への入口があるという。",
  ],
  "alb-peak": [
    "アルバピークは、永久凍土に覆われた峻厳な高山。",
    "すべての川は、この山を水源としている。",
  ],
  "hoshi-no-kumoi": [
    "ほしのくもいは、山頂から続く古い階段の先にある雲上の神域。",
    "地上よりも空気が澄んでいる。",
  ],
  "eterna-desert": [
    "エテルナ砂漠は、文明を拒む過酷な乾燥地帯。",
    "強い日差しの中、乾いた風が吹き抜ける。",
  ],
  "great-firefly-city": [
    "大流蛍楼宇は、ネオンが輝く魔導・科学の巨大都市。",
    "高層ビルが立ち並び、夜も明るく照らされている。",
  ],
  "ultra-blue": [
    "ウルトラブルーは、沿岸に広がる広大な海。",
    "波の音が絶えず響いている。",
  ],
  "tarasys-temple": [
    "タラシス海底神殿は、光の届かない深海に沈む古代の神殿。",
    "静まり返った水の中に、崩れた柱が並んでいる。",
  ],
  "la-amaranta": [
    "ラ・アマランタは、煮え滾る炎に包まれた冥界。",
    "赤く染まった空気の中、絶えず熱が漂っている。",
  ],
  "schwanburg-castle": [
    "シュヴァンブルク城は、湖畔に佇む歴史ある古城。",
    "静かな水面に、城の姿が映っている。",
  ],
  "kapadra-underground": [
    "カパドラ地下帝国は、地下に築かれた採掘と漆黒の帝国。",
    "灯りの届かない場所が、どこまでも続いている。",
  ],
};

/** 非遭遇時のフレーバーを折り返す最大行数 */
export const FLAVOR_MAX_LINES = 4;

/**
 * フレーバーテキストを句読点（。、）の切れ目で最大 maxLines 行に分割する。
 * 無理に4分割せず、意味の切れ目でまとめて折り返す（適切な分割量に留める）。
 * 句読点は行末に残し、区切りが無い短文は1行のまま返す。
 */
export function splitFlavorLines(
  text: string,
  maxLines: number = FLAVOR_MAX_LINES,
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // 句読点（、。）の直後を最小の区切り単位とする（句読点は各単位の末尾に残す）。
  const units = trimmed.match(/[^、。]*[、。]|[^、。]+/g) ?? [trimmed];
  if (units.length <= 1) return [trimmed];

  // 全体を maxLines 行に収められる程度の1行あたり目安長。極端な細切れは防ぐ。
  const target = Math.max(Math.ceil(trimmed.length / maxLines), 8);

  const lines: string[] = [];
  let current = "";
  for (const unit of units) {
    const wouldOverflow = current.length + unit.length > target;
    // 残り行数がある間だけ改行する。上限に達したら以降は最終行へまとめる。
    if (current && wouldOverflow && lines.length < maxLines - 1) {
      lines.push(current);
      current = unit;
    } else {
      current += unit;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** 正解2回ごとに表示を切り替える単位 */
const SWITCH_EVERY_N_CORRECT = 2;

function buildPool(habitatId: string | null | undefined): readonly string[] {
  const areaTips = habitatId ? (AREA_FLAVOR_TIPS[habitatId] ?? []) : [];
  return [...SYSTEM_TIPS, ...areaTips];
}

function safeCorrectCount(correctCount: number): number {
  return Number.isFinite(correctCount) ? Math.max(0, Math.floor(correctCount)) : 0;
}

/**
 * 非遭遇中にミッション欄へ表示するフレーバーテキストを1件返す。
 * システムTips（全エリア共通）と現在地のフレーバーを結合したプールから、
 * 正解数に応じて順送りで選ぶ。表示側は4行までの枠に折り返して全文を見せる。
 */
export function getMissionTip(
  habitatId: string | null | undefined,
  correctCount: number,
): string {
  const pool = buildPool(habitatId);
  if (pool.length === 0) return "";

  const index = Math.floor(safeCorrectCount(correctCount) / SWITCH_EVERY_N_CORRECT) % pool.length;
  return pool[index];
}
