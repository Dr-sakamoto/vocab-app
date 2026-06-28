// プール倍率ティア（全3400語対応）
export const POOL_TIERS = [
  { minPool: 3000, multiplier: 13, label: "MASTER", color: "#f59e0b" },
  { minPool: 2600, multiplier: 11, label: "Tier 8", color: "#ef4444" },
  { minPool: 2200, multiplier: 9, label: "Tier 7", color: "#8b5cf6" },
  { minPool: 1800, multiplier: 7, label: "Tier 6", color: "#3b82f6" },
  { minPool: 1400, multiplier: 5, label: "Tier 5", color: "#06b6d4" },
  { minPool: 1000, multiplier: 4, label: "Tier 4", color: "#10b981" },
  { minPool: 600, multiplier: 3, label: "Tier 3", color: "#84cc16" },
  { minPool: 300, multiplier: 2, label: "Tier 2", color: "#a3a3a3" },
  { minPool: 60, multiplier: 1, label: "Tier 1", color: "#d4d4d8" },
];

/** プールサイズから現在のティアを取得 */
export function getPoolTier(poolSize) {
  return POOL_TIERS.find(t => poolSize >= t.minPool) ?? POOL_TIERS.at(-1);
}

/** speciesId（図鑑番号）から lineId を逆引き */
export function getLineIdBySpeciesId(speciesId) {
  for (const line of MONSTER_LINES) {
    if (line.species.some(s => s.id === speciesId)) return line.id;
  }
  return DEFAULT_MONSTER_LINE_ID;
}

// Lv.N -> N+1 に必要な XP = N * 500
// Lv.N に到達するための累計 XP = 500 * N*(N-1)/2
const XP_FACTOR = 500;
export const MAX_MONSTER_LEVEL = 99;
export const MAX_MONSTER_XP = XP_FACTOR * ((MAX_MONSTER_LEVEL - 1) * MAX_MONSTER_LEVEL) / 2;

const SPRITE_ROOT =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/";

const crystalSprite = id => `${SPRITE_ROOT}/crystal/animated/${id}.gif`;
const goldSprite = id => `${SPRITE_ROOT}/yellow/transparent/${id}.png`;

function species({ id, name, nameEn, minLevel, maxLevel = MAX_MONSTER_LEVEL }) {
  return {
    id,
    name,
    nameEn,
    minLevel,
    maxLevel,
    sprite: crystalSprite(id),
    fallbackSprite: goldSprite(id),
  };
}

export const MONSTER_LINES = [
  // 御三家（独自IP Etymon）。lineId/species.id とスプライトは参照・差替の都合で
  // 据え置き（アートはP3で差替予定のプレースホルダ）。名前のみ IP_STARTERS.md に反映。
  {
    // DICT 系：言う／ことば
    id: "bulbasaur",
    name: "コトハ",
    species: [
      species({ id: 1, name: "コトハ", nameEn: "Dictling", minLevel: 1, maxLevel: 24 }),
      species({ id: 3, name: "コトダマ", nameEn: "Dictarch", minLevel: 25 }),
    ],
  },
  {
    // AUD 系：聞く／音
    id: "charmander",
    name: "ミミ",
    species: [
      species({ id: 4, name: "ミミ", nameEn: "Audling", minLevel: 1, maxLevel: 24 }),
      species({ id: 6, name: "ジゴクミミ", nameEn: "Audarch", minLevel: 25 }),
    ],
  },
  {
    // SPEC 系：見る／まなざし
    id: "squirtle",
    name: "マナコ",
    species: [
      species({ id: 7, name: "マナコ", nameEn: "Speculet", minLevel: 1, maxLevel: 24 }),
      species({ id: 9, name: "センリガン", nameEn: "Spectarch", minLevel: 25 }),
    ],
  },
  {
    id: "caterpie",
    name: "ダルマ",
    species: [
      species({ id: 10, name: "ダルマ", nameEn: "Flammel", minLevel: 1, maxLevel: 9 }),
      species({ id: 12, name: "ヒダルマ", nameEn: "Flammarch", minLevel: 10 }),
    ],
  },
  {
    id: "weedle",
    name: "アンヨ",
    species: [
      species({ id: 13, name: "アンヨ", nameEn: "Cursel", minLevel: 1, maxLevel: 9 }),
      species({ id: 15, name: "イダテン", nameEn: "Cursarch", minLevel: 10 }),
    ],
  },
  {
    id: "pidgey",
    name: "ハナスケ",
    species: [
      species({ id: 16, name: "ハナスケ", nameEn: "Nasel", minLevel: 1, maxLevel: 35 }),
      species({ id: 18, name: "テングバナ", nameEn: "Nasarch", minLevel: 36 }),
    ],
  },
  {
    id: "rattata",
    name: "カゲマル",
    species: [
      species({ id: 19, name: "カゲマル", nameEn: "Umbrel", minLevel: 1, maxLevel: 19 }),
      species({ id: 20, name: "クロマク", nameEn: "Umbrarch", minLevel: 20 }),
    ],
  },
  {
    id: "spearow",
    name: "ホタル",
    species: [
      species({ id: 21, name: "ホタル", nameEn: "Lucel", minLevel: 1, maxLevel: 19 }),
      species({ id: 22, name: "ゴコウ", nameEn: "Lucarch", minLevel: 20 }),
    ],
  },
  {
    id: "ekans",
    name: "ホネ",
    species: [
      species({ id: 23, name: "ホネ", nameEn: "Cranel", minLevel: 1, maxLevel: 21 }),
      species({ id: 24, name: "ドクロ", nameEn: "Cranarch", minLevel: 22 }),
    ],
  },
  {
    id: "pikachu",
    name: "ベロロ",
    species: [
      species({ id: 25, name: "ベロロ", nameEn: "Lingvel", minLevel: 1, maxLevel: 98 }),
      species({ id: 26, name: "ベロベロロロ", nameEn: "Lingvarch", minLevel: 99 }),
    ],
  },
  {
    id: "sandshrew",
    name: "オテテ",
    species: [
      species({ id: 27, name: "オテテ", nameEn: "Manel", minLevel: 1, maxLevel: 21 }),
      species({ id: 28, name: "センジュ", nameEn: "Manarch", minLevel: 22 }),
    ],
  },
  {
    id: "nidoran-f",
    name: "ハラ",
    species: [
      species({ id: 29, name: "ハラ", nameEn: "Ventrel", minLevel: 1, maxLevel: 98 }),
      species({ id: 31, name: "タイコバラ", nameEn: "Ventrarch", minLevel: 99 }),
    ],
  },
  {
    id: "nidoran-m",
    name: "ソヨ",
    species: [
      species({ id: 32, name: "ソヨ", nameEn: "Zephyrel", minLevel: 1, maxLevel: 98 }),
      species({ id: 34, name: "タツマキ", nameEn: "Zephyrarch", minLevel: 99 }),
    ],
  },
  {
    id: "clefairy",
    name: "ホシノコ",
    species: [
      species({ id: 35, name: "ホシノコ", nameEn: "Astrling", minLevel: 1, maxLevel: 98 }),
      species({ id: 36, name: "オボロヅキ", nameEn: "Astrarch", minLevel: 99 }),
    ],
  },
  {
    id: "vulpix",
    name: "ヒノコ",
    species: [
      species({ id: 37, name: "ヒノコ", nameEn: "Ignling", minLevel: 1, maxLevel: 98 }),
      species({ id: 38, name: "キュウビ", nameEn: "Ignarch", minLevel: 99 }),
    ],
  },
  {
    id: "jigglypuff",
    name: "フワウタ",
    species: [
      species({ id: 39, name: "フワウタ", nameEn: "Cantling", minLevel: 1, maxLevel: 98 }),
      species({ id: 40, name: "コモリウタ", nameEn: "Cantarch", minLevel: 99 }),
    ],
  },
  {
    id: "zubat",
    name: "ヨバネ",
    species: [
      species({ id: 41, name: "ヨバネ", nameEn: "Noctling", minLevel: 1, maxLevel: 21 }),
      species({ id: 42, name: "ヨイヤミ", nameEn: "Noctarch", minLevel: 22 }),
    ],
  },
  {
    id: "oddish",
    name: "ネッコ",
    species: [
      species({ id: 43, name: "ネッコ", nameEn: "Florling", minLevel: 1, maxLevel: 20 }),
      species({ id: 44, name: "ツボミ", nameEn: "Florine", minLevel: 21, maxLevel: 98 }),
      species({ id: 45, name: "マンカイ", nameEn: "Florarch", minLevel: 99 }),
    ],
  },
  {
    id: "paras",
    name: "キノムシ",
    species: [
      species({ id: 46, name: "キノムシ", nameEn: "Fungling", minLevel: 1, maxLevel: 23 }),
      species({ id: 47, name: "カビダケ", nameEn: "Fungarch", minLevel: 24 }),
    ],
  },
  {
    id: "venonat",
    name: "モフムシ",
    species: [
      species({ id: 48, name: "モフムシ", nameEn: "Lumling", minLevel: 1, maxLevel: 30 }),
      species({ id: 49, name: "ヒトリガ", nameEn: "Lumarch", minLevel: 31 }),
    ],
  },
  {
    id: "diglett",
    name: "モグ",
    species: [
      species({ id: 50, name: "モグ", nameEn: "Fossling", minLevel: 1, maxLevel: 25 }),
      species({ id: 51, name: "ミツモグ", nameEn: "Fossarch", minLevel: 26 }),
    ],
  },
  {
    id: "meowth",
    name: "コバン",
    species: [
      species({ id: 52, name: "コバン", nameEn: "Lucrling", minLevel: 1, maxLevel: 27 }),
      species({ id: 53, name: "オオバン", nameEn: "Lucrarch", minLevel: 28 }),
    ],
  },
  {
    id: "psyduck",
    name: "ポヤ",
    species: [
      species({ id: 54, name: "ポヤ", nameEn: "Mentling", minLevel: 1, maxLevel: 32 }),
      species({ id: 55, name: "ズノウ", nameEn: "Mentarch", minLevel: 33 }),
    ],
  },
  {
    id: "mankey",
    name: "プンザル",
    species: [
      species({ id: 56, name: "プンザル", nameEn: "Iraling", minLevel: 1, maxLevel: 27 }),
      species({ id: 57, name: "オニイカリ", nameEn: "Irarch", minLevel: 28 }),
    ],
  },
  {
    id: "growlithe",
    name: "ヒノワン",
    species: [
      species({ id: 58, name: "ヒノワン", nameEn: "Ardling", minLevel: 1, maxLevel: 98 }),
      species({ id: 59, name: "メラオオカミ", nameEn: "Ardarch", minLevel: 99 }),
    ],
  },
  {
    id: "poliwag",
    name: "オタマ",
    species: [
      species({ id: 60, name: "オタマ", nameEn: "Fluling", minLevel: 1, maxLevel: 24 }),
      species({ id: 61, name: "ウズマキ", nameEn: "Fluxine", minLevel: 25, maxLevel: 98 }),
      species({ id: 62, name: "ゲコオウ", nameEn: "Fluarch", minLevel: 99 }),
    ],
  },
  {
    id: "abra",
    name: "ウツラ",
    species: [
      species({ id: 63, name: "ウツラ", nameEn: "Mirling", minLevel: 1, maxLevel: 15 }),
      species({ id: 64, name: "マボロシ", nameEn: "Mirage", minLevel: 16, maxLevel: 98 }),
      species({ id: 65, name: "ゲンエイ", nameEn: "Mirarch", minLevel: 99 }),
    ],
  },
  {
    id: "machop",
    name: "チカ",
    species: [
      species({ id: 66, name: "チカ", nameEn: "Fortling", minLevel: 1, maxLevel: 27 }),
      species({ id: 67, name: "ムキムキ", nameEn: "Fortine", minLevel: 28, maxLevel: 98 }),
      species({ id: 68, name: "ゴウリキ", nameEn: "Fortarch", minLevel: 99 }),
    ],
  },
  {
    id: "bellsprout",
    name: "メバエ",
    species: [
      species({ id: 69, name: "メバエ", nameEn: "Vorling", minLevel: 1, maxLevel: 20 }),
      species({ id: 70, name: "パクパク", nameEn: "Vorine", minLevel: 21, maxLevel: 98 }),
      species({ id: 71, name: "マルノミ", nameEn: "Vorarch", minLevel: 99 }),
    ],
  },
  {
    id: "tentacool",
    name: "プヨ",
    species: [
      species({ id: 72, name: "プヨ", nameEn: "Marling", minLevel: 1, maxLevel: 29 }),
      species({ id: 73, name: "ウミボウズ", nameEn: "Mararch", minLevel: 30 }),
    ],
  },
  {
    id: "geodude",
    name: "コイシ",
    species: [
      species({ id: 74, name: "コイシ", nameEn: "Petrling", minLevel: 1, maxLevel: 24 }),
      species({ id: 75, name: "ゴロイワ", nameEn: "Petrine", minLevel: 25, maxLevel: 98 }),
      species({ id: 76, name: "ガンセキ", nameEn: "Petrarch", minLevel: 99 }),
    ],
  },
  {
    id: "ponyta",
    name: "ヒバシリ",
    species: [
      species({ id: 77, name: "ヒバシリ", nameEn: "Celerling", minLevel: 1, maxLevel: 39 }),
      species({ id: 78, name: "カゲロウ", nameEn: "Celerarch", minLevel: 40 }),
    ],
  },
  {
    id: "slowpoke",
    name: "ノロマ",
    species: [
      species({ id: 79, name: "ノロマ", nameEn: "Tardling", minLevel: 1, maxLevel: 36 }),
      species({ id: 80, name: "ノンビリ", nameEn: "Tardarch", minLevel: 37 }),
    ],
  },
  {
    id: "magnemite",
    name: "ピタ",
    species: [
      species({ id: 81, name: "ピタ", nameEn: "Tractling", minLevel: 1, maxLevel: 29 }),
      species({ id: 82, name: "ミツピタ", nameEn: "Tractarch", minLevel: 30 }),
    ],
  },
  {
    id: "farfetchd",
    name: "ツチノコ",
    species: [
      species({ id: 83, name: "ツチノコ", nameEn: "Tsuchinoko", minLevel: 1 }),
    ],
  },
  {
    id: "doduo",
    name: "フタゴ",
    species: [
      species({ id: 84, name: "フタゴ", nameEn: "Dualing", minLevel: 1, maxLevel: 30 }),
      species({ id: 85, name: "ミツゴ", nameEn: "Duarch", minLevel: 31 }),
    ],
  },
  {
    id: "seel",
    name: "ユキマル",
    species: [
      species({ id: 86, name: "ユキマル", nameEn: "Glacling", minLevel: 1, maxLevel: 33 }),
      species({ id: 87, name: "コオリジュウ", nameEn: "Glacarch", minLevel: 34 }),
    ],
  },
  {
    id: "grimer",
    name: "ベチョ",
    species: [
      species({ id: 88, name: "ベチョ", nameEn: "Putrling", minLevel: 1, maxLevel: 37 }),
      species({ id: 89, name: "オオヘドロ", nameEn: "Putrarch", minLevel: 38 }),
    ],
  },
  {
    id: "shellder",
    name: "カラマル",
    species: [
      species({ id: 90, name: "カラマル", nameEn: "Crustling", minLevel: 1, maxLevel: 98 }),
      species({ id: 91, name: "トゲガイ", nameEn: "Crustarch", minLevel: 99 }),
    ],
  },
  {
    id: "gastly",
    name: "ヒトダマ",
    species: [
      species({ id: 92, name: "ヒトダマ", nameEn: "Mortling", minLevel: 1, maxLevel: 24 }),
      species({ id: 93, name: "オバケ", nameEn: "Mortine", minLevel: 25, maxLevel: 98 }),
      species({ id: 94, name: "ヨウマ", nameEn: "Mortarch", minLevel: 99 }),
    ],
  },
  {
    id: "onix",
    name: "モスマン",
    species: [
      species({ id: 95, name: "モスマン", nameEn: "Mothman", minLevel: 1 }),
    ],
  },
  {
    id: "drowzee",
    name: "ネムケ",
    species: [
      species({ id: 96, name: "ネムケ", nameEn: "Somnling", minLevel: 1, maxLevel: 25 }),
      species({ id: 97, name: "ユメクイ", nameEn: "Somnarch", minLevel: 26 }),
    ],
  },
  {
    id: "krabby",
    name: "チョキ",
    species: [
      species({ id: 98, name: "チョキ", nameEn: "Prehling", minLevel: 1, maxLevel: 27 }),
      species({ id: 99, name: "オオバサミ", nameEn: "Preharch", minLevel: 28 }),
    ],
  },
  {
    id: "voltorb",
    name: "コロ",
    species: [
      species({ id: 100, name: "コロ", nameEn: "Volvling", minLevel: 1, maxLevel: 29 }),
      species({ id: 101, name: "ドカン", nameEn: "Volvarch", minLevel: 30 }),
    ],
  },
  {
    id: "exeggcute",
    name: "タマゴロ",
    species: [
      species({ id: 102, name: "タマゴロ", nameEn: "Ovling", minLevel: 1, maxLevel: 98 }),
      species({ id: 103, name: "ヤシノミ", nameEn: "Ovarch", minLevel: 99 }),
    ],
  },
  {
    id: "cubone",
    name: "ホネコ",
    species: [
      species({ id: 104, name: "ホネコ", nameEn: "Ossling", minLevel: 1, maxLevel: 27 }),
      species({ id: 105, name: "ホネカブリ", nameEn: "Ossarch", minLevel: 28 }),
    ],
  },
  {
    id: "hitmonlee",
    name: "チュパカブラ",
    species: [
      species({ id: 106, name: "チュパカブラ", nameEn: "Chupacabra", minLevel: 1 }),
    ],
  },
  {
    id: "hitmonchan",
    name: "ジャージーデビル",
    species: [
      species({ id: 107, name: "ジャージーデビル", nameEn: "JerseyDevil", minLevel: 1 }),
    ],
  },
  {
    id: "lickitung",
    name: "バンイップ",
    species: [
      species({ id: 108, name: "バンイップ", nameEn: "Bunyip", minLevel: 1 }),
    ],
  },
  {
    id: "koffing",
    name: "モクモク",
    species: [
      species({ id: 109, name: "モクモク", nameEn: "Fumling", minLevel: 1, maxLevel: 34 }),
      species({ id: 110, name: "ドクガス", nameEn: "Fumarch", minLevel: 35 }),
    ],
  },
  {
    id: "rhyhorn",
    name: "ツノマル",
    species: [
      species({ id: 111, name: "ツノマル", nameEn: "Cornling", minLevel: 1, maxLevel: 41 }),
      species({ id: 112, name: "イワヅノ", nameEn: "Cornarch", minLevel: 42 }),
    ],
  },
  {
    id: "chansey",
    name: "アマビエ",
    species: [
      species({ id: 113, name: "アマビエ", nameEn: "Amabie", minLevel: 1 }),
    ],
  },
  {
    id: "tangela",
    name: "ケサランパサラン",
    species: [
      species({ id: 114, name: "ケサランパサラン", nameEn: "Kesaran", minLevel: 1 }),
    ],
  },
  {
    id: "kangaskhan",
    name: "ヒバゴン",
    species: [
      species({ id: 115, name: "ヒバゴン", nameEn: "Hibagon", minLevel: 1 }),
    ],
  },
  {
    id: "horsea",
    name: "ナミノコ",
    species: [
      species({ id: 116, name: "ナミノコ", nameEn: "Undling", minLevel: 1, maxLevel: 31 }),
      species({ id: 117, name: "ウミリュウ", nameEn: "Undarch", minLevel: 32 }),
    ],
  },
  {
    id: "goldeen",
    name: "キンヒレ",
    species: [
      species({ id: 118, name: "キンヒレ", nameEn: "Piscling", minLevel: 1, maxLevel: 32 }),
      species({ id: 119, name: "ウオウ", nameEn: "Piscarch", minLevel: 33 }),
    ],
  },
  {
    id: "staryu",
    name: "ホシデ",
    species: [
      species({ id: 120, name: "ホシデ", nameEn: "Stelling", minLevel: 1, maxLevel: 98 }),
      species({ id: 121, name: "ナナホシ", nameEn: "Stellarch", minLevel: 99 }),
    ],
  },
  {
    id: "mr-mime",
    name: "フラットウッズ",
    species: [
      species({ id: 122, name: "フラットウッズ", nameEn: "Flatwoods", minLevel: 1 }),
    ],
  },
  {
    id: "scyther",
    name: "ドーバーデーモン",
    species: [
      species({ id: 123, name: "ドーバーデーモン", nameEn: "DoverDemon", minLevel: 1 }),
    ],
  },
  {
    id: "jynx",
    name: "ヨーウィ",
    species: [
      species({ id: 124, name: "ヨーウィ", nameEn: "Yowie", minLevel: 1 }),
    ],
  },
  {
    id: "electabuzz",
    name: "オゴポゴ",
    species: [
      species({ id: 125, name: "オゴポゴ", nameEn: "Ogopogo", minLevel: 1 }),
    ],
  },
  {
    id: "magmar",
    name: "ヒフキ",
    species: [
      species({ id: 126, name: "ヒフキ", nameEn: "Flamix", minLevel: 1 }),
    ],
  },
  {
    id: "pinsir",
    name: "オオアゴ",
    species: [
      species({ id: 127, name: "オオアゴ", nameEn: "Tenix", minLevel: 1 }),
    ],
  },
  {
    id: "tauros",
    name: "アバレウシ",
    species: [
      species({ id: 128, name: "アバレウシ", nameEn: "Furix", minLevel: 1 }),
    ],
  },
  {
    id: "magikarp",
    name: "ピチ",
    species: [
      species({ id: 129, name: "ピチ", nameEn: "Potling", minLevel: 1, maxLevel: 19 }),
      species({ id: 130, name: "アバレリュウ", nameEn: "Potarch", minLevel: 20 }),
    ],
  },
  {
    id: "lapras",
    name: "ノリクジラ",
    species: [
      species({ id: 131, name: "ノリクジラ", nameEn: "Navix", minLevel: 1 }),
    ],
  },
  {
    id: "ditto",
    name: "ノッペ",
    species: [
      species({ id: 132, name: "ノッペ", nameEn: "Similix", minLevel: 1 }),
    ],
  },
  {
    id: "eevee",
    name: "ノビ",
    species: [
      species({ id: 133, name: "ノビ", nameEn: "Genix", minLevel: 1 }),
    ],
  },
  {
    id: "vaporeon",
    name: "ミズノビ",
    species: [
      species({ id: 134, name: "ミズノビ", nameEn: "Aquix", minLevel: 1 }),
    ],
  },
  {
    id: "jolteon",
    name: "ライノビ",
    species: [
      species({ id: 135, name: "ライノビ", nameEn: "Voltix", minLevel: 1 }),
    ],
  },
  {
    id: "flareon",
    name: "ヒノビ",
    species: [
      species({ id: 136, name: "ヒノビ", nameEn: "Pyrix", minLevel: 1 }),
    ],
  },
  {
    id: "porygon",
    name: "ピコ",
    species: [
      species({ id: 137, name: "ピコ", nameEn: "Datix", minLevel: 1 }),
    ],
  },
  {
    id: "omanyte",
    name: "ウズガイ",
    species: [
      species({ id: 138, name: "ウズガイ", nameEn: "Spirling", minLevel: 1, maxLevel: 39 }),
      species({ id: 139, name: "オオウズ", nameEn: "Spirarch", minLevel: 40 }),
    ],
  },
  {
    id: "kabuto",
    name: "ムカシ",
    species: [
      species({ id: 140, name: "ムカシ", nameEn: "Priscling", minLevel: 1, maxLevel: 39 }),
      species({ id: 141, name: "カマキバ", nameEn: "Priscarch", minLevel: 40 }),
    ],
  },
  {
    id: "aerodactyl",
    name: "ハネイシ",
    species: [
      species({ id: 142, name: "ハネイシ", nameEn: "Aerix", minLevel: 1 }),
    ],
  },
  {
    id: "snorlax",
    name: "ネボスケ",
    species: [
      species({ id: 143, name: "ネボスケ", nameEn: "Vastix", minLevel: 1 }),
    ],
  },
  {
    id: "articuno",
    name: "イテハ",
    species: [
      species({ id: 144, name: "イテハ", nameEn: "Hibernix", minLevel: 1 }),
    ],
  },
  {
    id: "zapdos",
    name: "イカヅチ",
    species: [
      species({ id: 145, name: "イカヅチ", nameEn: "Tonarch", minLevel: 1 }),
    ],
  },
  {
    id: "moltres",
    name: "ホムラ",
    species: [
      species({ id: 146, name: "ホムラ", nameEn: "Fervarch", minLevel: 1 }),
    ],
  },
  {
    id: "dratini",
    name: "リュウノコ",
    species: [
      species({ id: 147, name: "リュウノコ", nameEn: "Aurling", minLevel: 1, maxLevel: 29 }),
      species({ id: 148, name: "ミズチ", nameEn: "Aurine", minLevel: 30, maxLevel: 54 }),
      species({ id: 149, name: "オオリュウ", nameEn: "Aurarch", minLevel: 55 }),
    ],
  },
  {
    id: "mewtwo",
    name: "ウツシ",
    species: [
      species({ id: 150, name: "ウツシ", nameEn: "Psycharch", minLevel: 1 }),
    ],
  },
  {
    id: "mew",
    name: "ハジマリ",
    species: [
      species({ id: 151, name: "ハジマリ", nameEn: "Protarch", minLevel: 1 }),
    ],
  },

];



export const DEFAULT_MONSTER_LINE_ID = "bulbasaur";
export const BULBASAUR_LINE = MONSTER_LINES.find(line => line.id === DEFAULT_MONSTER_LINE_ID).species;
export const PARTY_SIZE = 6;
export const BOX_LIMIT = 500;
export const DEFAULT_MONSTER_COLLECTION = {
  version: 1,
  activeId: null,
  partyIds: [null, null, null, null, null, null],
  habitatVisits: {},
  professorTransfers: {},
  giftClaims: {},
  monsters: [],
};

// Gift events are awarded by two different progression systems:
// - professor-transfer: cumulative count of boxed monsters sent to the professor
// - pool: unlocked vocabulary pool size / story progression milestones (habitatId → minPool)
export const GIFT_MONSTER_EVENTS = [
  {
    id: "professor-farfetchd-50",
    lineId: "farfetchd",
    level: 20,
    trigger: "professor-transfer",
    requiredTransfers: 50,
    location: "クチバシティ",
    message: "博士からツチノコをもらった！",
  },
  {
    id: "professor-mr-mime-100",
    lineId: "mr-mime",
    level: 20,
    trigger: "professor-transfer",
    requiredTransfers: 100,
    location: "2ばんどうろ",
    message: "博士からフラットウッズをもらった！",
  },
  {
    id: "professor-lickitung-120",
    lineId: "lickitung",
    level: 25,
    trigger: "professor-transfer",
    requiredTransfers: 120,
    location: "18ばんどうろ",
    message: "博士からバンイップをもらった！",
  },
  {
    id: "professor-jynx-150",
    lineId: "jynx",
    level: 25,
    trigger: "professor-transfer",
    requiredTransfers: 150,
    location: "ハナダシティ",
    message: "博士からヨーウィをもらった！",
  },
  {
    id: "celadon-eevee",
    lineId: "eevee",
    level: 25,
    trigger: "pool",
    habitatId: "route-7",
    location: "タマムシシティ",
    message: "タマムシシティでノビをもらった！",
  },
  {
    id: "celadon-porygon",
    lineId: "porygon",
    level: 26,
    trigger: "pool",
    habitatId: "route-7",
    location: "タマムシシティ",
    message: "ゲームコーナーでピコをもらった！",
  },
  {
    id: "silph-lapras",
    lineId: "lapras",
    level: 15,
    trigger: "pool",
    habitatId: "pokemon-tower",
    location: "シルフカンパニー",
    message: "シルフカンパニーでノリクジラをもらった！",
  },
];

/** グレン島の化石は3択1。原作どおり1匹だけ復元できる */
export const FOSSIL_GIFT_GROUP = {
  id: "cinnabar-fossil",
  trigger: "pool",
  habitatId: "pokemon-mansion",
  location: "グレン島",
  level: 30,
  choices: [
    { lineId: "omanyte", message: "グレン島の研究所でオムナイトを復元した！" },
    { lineId: "kabuto", message: "グレン島の研究所でカブトを復元した！" },
    { lineId: "aerodactyl", message: "グレン島の研究所でプテラを復元した！" },
  ],
};

function resolveGiftMinPool(event, habitatMinPools = {}) {
  if (Number.isFinite(Number(event.minPool))) return Number(event.minPool);
  if (typeof event.habitatId === "string" && Number.isFinite(Number(habitatMinPools[event.habitatId]))) {
    return Number(habitatMinPools[event.habitatId]);
  }
  return Infinity;
}

function isFossilGiftClaimed(giftClaims = {}) {
  return FOSSIL_GIFT_GROUP.choices.some(choice => giftClaims[`${FOSSIL_GIFT_GROUP.id}-${choice.lineId}`]);
}

const MONSTER_LINE_BY_ID = new Map(MONSTER_LINES.map(line => [line.id, line]));

function clampLevel(level) {
  const n = Number(level);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_MONSTER_LEVEL, Math.floor(n)));
}

export function clampMonsterXP(xp) {
  const n = Number(xp);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_MONSTER_XP, n));
}

export function normalizeMonsterLineId(lineId) {
  return MONSTER_LINE_BY_ID.has(lineId) ? lineId : DEFAULT_MONSTER_LINE_ID;
}

export function getMonsterLine(lineId = DEFAULT_MONSTER_LINE_ID) {
  return MONSTER_LINE_BY_ID.get(normalizeMonsterLineId(lineId));
}

export function getAvailableMonsterLines() {
  return MONSTER_LINES;
}

export function createMonsterInstance({
  id,
  lineId = DEFAULT_MONSTER_LINE_ID,
  totalXP = 0,
  acquiredAt = null,
  heldItemType = null,
  heldItemName = null,
  forcedSpeciesId = null,
} = {}) {
  const safeLineId = normalizeMonsterLineId(lineId);
  return {
    id: id ?? `${safeLineId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    lineId: safeLineId,
    totalXP: clampMonsterXP(totalXP),
    acquiredAt,
    heldItemType: typeof heldItemType === "string" && heldItemType ? heldItemType : null,
    heldItemName: typeof heldItemName === "string" && heldItemName ? heldItemName : null,
    forcedSpeciesId: Number.isFinite(Number(forcedSpeciesId)) ? Number(forcedSpeciesId) : null,
  };
}

export function normalizeMonsterCollection(collection, legacy = {}) {
  const legacyLineId = normalizeMonsterLineId(legacy.lineId);
  const legacyXP = clampMonsterXP(legacy.totalXP);
  const sourceMonsters = Array.isArray(collection?.monsters)
    ? collection.monsters
    : DEFAULT_MONSTER_COLLECTION.monsters.map(monster => ({
        ...monster,
        totalXP: monster.lineId === legacyLineId ? legacyXP : 0,
      }));

  const byId = new Map();
  for (const monster of sourceMonsters) {
    if (!monster || typeof monster !== "object") continue;
    const instance = createMonsterInstance({
      id: typeof monster.id === "string" && monster.id ? monster.id : undefined,
      lineId: monster.lineId,
      totalXP: monster.totalXP,
      acquiredAt: monster.acquiredAt ?? null,
      heldItemType: monster.heldItemType ?? null,
      heldItemName: monster.heldItemName ?? null,
      forcedSpeciesId: monster.forcedSpeciesId ?? null,
    });
    byId.set(instance.id, instance);
  }

  const monsters = Array.from(byId.values());
  const requestedActiveId = collection?.activeId;
  const fallbackActiveId =
    monsters.find(monster => monster.lineId === legacyLineId)?.id ??
    monsters[0]?.id ??
    null;
  const activeId =
    requestedActiveId && monsters.some(monster => monster.id === requestedActiveId)
      ? requestedActiveId
      : fallbackActiveId;

  const requestedPartyIds = Array.isArray(collection?.partyIds)
    ? collection.partyIds
    : DEFAULT_MONSTER_COLLECTION.partyIds;
  const monsterIds = new Set(monsters.map(monster => monster.id));
  const partyIds = [];
  for (const id of requestedPartyIds) {
    if (partyIds.length >= PARTY_SIZE) break;
    if (id === null || id === undefined || id === "") {
      partyIds.push(null);
      continue;
    }
    if (typeof id !== "string" || !monsterIds.has(id) || partyIds.includes(id)) {
      partyIds.push(null);
      continue;
    }
    partyIds.push(id);
  }
  while (partyIds.length < PARTY_SIZE) partyIds.push(null);

  const nonEmptyPartyIds = partyIds.filter(Boolean);
  if (nonEmptyPartyIds.length === 0 && activeId) {
    partyIds[0] = activeId;
  } else if (activeId && !partyIds.includes(activeId)) {
    const emptyIndex = partyIds.findIndex(id => id === null);
    if (emptyIndex >= 0) partyIds[emptyIndex] = activeId;
    else partyIds[0] = activeId;
  }

  const activeIndex = partyIds.indexOf(activeId);
  if (activeIndex > 0) {
    [partyIds[0], partyIds[activeIndex]] = [partyIds[activeIndex], partyIds[0]];
  } else if (activeIndex < 0) {
    const firstMonsterId = partyIds.find(Boolean) ?? activeId;
    const firstMonsterIndex = partyIds.indexOf(firstMonsterId);
    if (firstMonsterIndex > 0) {
      [partyIds[0], partyIds[firstMonsterIndex]] = [partyIds[firstMonsterIndex], partyIds[0]];
    } else {
      partyIds[0] = firstMonsterId;
    }
  }

  const seenPartyIds = new Set();
  for (let i = 0; i < partyIds.length; i += 1) {
    const id = partyIds[i];
    if (!id) continue;
    if (seenPartyIds.has(id)) partyIds[i] = null;
    else seenPartyIds.add(id);
  }

  const habitatVisits = {};
  if (collection?.habitatVisits && typeof collection.habitatVisits === "object") {
    for (const [habitatId, visits] of Object.entries(collection.habitatVisits)) {
      const safeVisits = Number(visits);
      if (Number.isFinite(safeVisits) && safeVisits > 0) {
        habitatVisits[habitatId] = Math.floor(safeVisits);
      }
    }
  }

  const professorTransfers = {};
  if (collection?.professorTransfers && typeof collection.professorTransfers === "object") {
    for (const [lineId, count] of Object.entries(collection.professorTransfers)) {
      const safeLineId = normalizeMonsterLineId(lineId);
      const safeCount = Number(count);
      if (Number.isFinite(safeCount) && safeCount > 0) {
        professorTransfers[safeLineId] = (professorTransfers[safeLineId] ?? 0) + Math.floor(safeCount);
      }
    }
  }

  const validGiftIds = new Set([
    ...GIFT_MONSTER_EVENTS.map(event => event.id),
    ...FOSSIL_GIFT_GROUP.choices.map(choice => `${FOSSIL_GIFT_GROUP.id}-${choice.lineId}`),
  ]);
  const giftClaims = {};
  if (collection?.giftClaims && typeof collection.giftClaims === "object") {
    for (const [giftId, claimed] of Object.entries(collection.giftClaims)) {
      if (claimed && validGiftIds.has(giftId)) {
        giftClaims[giftId] = true;
      }
    }
  }

  const storyProgress =
    collection?.storyProgress && typeof collection.storyProgress === "object"
      ? collection.storyProgress
      : undefined;

  return {
    version: 1,
    activeId: partyIds[0] ?? activeId,
    partyIds,
    habitatVisits,
    professorTransfers,
    giftClaims,
    monsters,
    ...(storyProgress ? { storyProgress } : {}),
  };
}

export function getActiveMonster(collection) {
  const normalized = normalizeMonsterCollection(collection);
  return (
    normalized.monsters.find(monster => monster.id === normalized.activeId) ??
    normalized.monsters[0]
  );
}

export function getMonsterById(collection, monsterId) {
  const normalized = normalizeMonsterCollection(collection);
  return normalized.monsters.find(monster => monster.id === monsterId) ?? null;
}

export function setActiveMonster(collection, monsterId) {
  const normalized = normalizeMonsterCollection(collection);
  if (!normalized.monsters.some(monster => monster.id === monsterId)) return normalized;
  const partyIds = normalized.partyIds.slice(0, PARTY_SIZE);
  const currentIndex = partyIds.indexOf(monsterId);
  if (currentIndex > 0) {
    [partyIds[0], partyIds[currentIndex]] = [partyIds[currentIndex], partyIds[0]];
  } else if (currentIndex < 0) {
    partyIds[0] = monsterId;
  }
  return { ...normalized, activeId: monsterId, partyIds };
}

export function getPartySlots(collection) {
  const normalized = normalizeMonsterCollection(collection);
  const byId = new Map(normalized.monsters.map(monster => [monster.id, monster]));
  return Array.from({ length: PARTY_SIZE }, (_, index) => {
    const id = normalized.partyIds[index];
    return id ? byId.get(id) ?? null : null;
  });
}

export function getPartyCount(collection) {
  return getPartySlots(collection).filter(Boolean).length;
}

export function updatePartyXP(collection, gainedXP) {
  const normalized = normalizeMonsterCollection(collection);
  const partyIdSet = new Set(normalized.partyIds);
  const fullXP = clampMonsterXP(gainedXP);
  const halfXP = Math.floor(fullXP * 0.5);

  return {
    ...normalized,
    monsters: normalized.monsters.map(monster => {
      if (!partyIdSet.has(monster.id)) return monster;
      const xpToAdd = monster.id === normalized.activeId ? fullXP : halfXP;
      const previousXP = monster.totalXP;
      const nextXP = clampMonsterXP(previousXP + xpToAdd);
      let nextMonster = {
        ...monster,
        totalXP: nextXP,
      };

      if (
        xpToAdd > 0 &&
        monster.heldItemType &&
        !monster.forcedSpeciesId
      ) {
        const previousState = getMonsterState(previousXP, monster.lineId);
        const nextState = getMonsterState(nextXP, monster.lineId);
        if (nextState.level > previousState.level) {
          const targetSpeciesId = getItemEvolutionTargetSpeciesId(previousState.species.id, monster.heldItemType);
          if (Number.isFinite(Number(targetSpeciesId))) {
            nextMonster = {
              ...nextMonster,
              heldItemType: null,
              heldItemName: null,
              forcedSpeciesId: targetSpeciesId,
            };
          }
        }
      }

      return nextMonster;
    }),
  };
}

export function getBoxMonsters(collection) {
  const normalized = normalizeMonsterCollection(collection);
  const partyIdSet = new Set(normalized.partyIds);
  return normalized.monsters.filter(monster => !partyIdSet.has(monster.id));
}

export function sortBoxMonsters(collection, mode) {
  const normalized = normalizeMonsterCollection(collection);
  const partyIdSet = new Set(normalized.partyIds);
  const sortedBoxMonsters = normalized.monsters
    .filter(monster => !partyIdSet.has(monster.id))
    .sort((a, b) => {
      const aState = getMonsterDisplayState(a);
      const bState = getMonsterDisplayState(b);

      if (mode === "dex") {
        return (
          aState.species.id - bState.species.id ||
          bState.level - aState.level ||
          b.totalXP - a.totalXP ||
          a.id.localeCompare(b.id)
        );
      }
      if (mode === "level") {
        return (
          bState.level - aState.level ||
          b.totalXP - a.totalXP ||
          aState.species.id - bState.species.id ||
          a.id.localeCompare(b.id)
        );
      }
      return 0;
    });

  const boxQueue = [...sortedBoxMonsters];
  return normalizeMonsterCollection({
    ...normalized,
    monsters: normalized.monsters.map(monster =>
      partyIdSet.has(monster.id) ? monster : boxQueue.shift(),
    ),
  });
}

export function getBoxCount(collection) {
  return getBoxMonsters(collection).length;
}

export function sendPartySlotToBox(collection, partyIndex) {
  const normalized = normalizeMonsterCollection(collection);
  if (!Number.isInteger(partyIndex) || partyIndex < 0 || partyIndex >= PARTY_SIZE) return normalized;
  if (!normalized.partyIds[partyIndex]) return normalized;

  const filledCount = normalized.partyIds.filter(Boolean).length;
  if (filledCount <= 1) return normalized;

  const partyIds = normalized.partyIds.slice(0, PARTY_SIZE);
  partyIds[partyIndex] = null;
  if (!partyIds[0]) {
    const nextActiveIndex = partyIds.findIndex(Boolean);
    if (nextActiveIndex > 0) {
      [partyIds[0], partyIds[nextActiveIndex]] = [partyIds[nextActiveIndex], partyIds[0]];
    }
  }

  return normalizeMonsterCollection({
    ...normalized,
    activeId: partyIds[0] ?? normalized.activeId,
    partyIds,
  });
}

export function swapMonsterLocations(collection, first, second) {
  const normalized = normalizeMonsterCollection(collection);
  if (!first || !second) return normalized;

  const partyIds = normalized.partyIds.slice(0, PARTY_SIZE);
  const monsters = [...normalized.monsters];
  const partyIdSet = new Set(partyIds);

  const getLocationId = location => {
    if (location.area === "party") return partyIds[location.index] ?? null;
    if (location.area === "box") {
      const id = location.id;
      return id && !partyIdSet.has(id) ? id : null;
    }
    return null;
  };

  const firstId = getLocationId(first);
  const secondId = getLocationId(second);
  if (first.area !== "party" && !firstId) return normalized;
  if (second.area !== "party" && !secondId) return normalized;
  if (firstId && secondId && firstId === secondId) return normalized;

  if (first.area === "party" && second.area === "party") {
    [partyIds[first.index], partyIds[second.index]] = [partyIds[second.index], partyIds[first.index]];
  } else if (first.area === "party" && second.area === "box") {
    if (!firstId) return normalized;
    partyIds[first.index] = secondId;
  } else if (first.area === "box" && second.area === "party") {
    partyIds[second.index] = firstId;
  } else if (first.area === "box" && second.area === "box") {
    const firstIndex = monsters.findIndex(monster => monster.id === firstId);
    const secondIndex = monsters.findIndex(monster => monster.id === secondId);
    if (firstIndex >= 0 && secondIndex >= 0) {
      [monsters[firstIndex], monsters[secondIndex]] = [monsters[secondIndex], monsters[firstIndex]];
    }
  }

  return normalizeMonsterCollection({
    ...normalized,
    activeId: partyIds[0] ?? normalized.activeId,
    partyIds,
    monsters,
  });
}

export function updateMonsterXP(collection, monsterId, getNextXP) {
  const normalized = normalizeMonsterCollection(collection);
  return {
    ...normalized,
    monsters: normalized.monsters.map(monster => {
      if (monster.id !== monsterId) return monster;
      return {
        ...monster,
        totalXP: clampMonsterXP(getNextXP(monster.totalXP)),
      };
    }),
  };
}

export function sendMonstersToProfessor(collection, monsterIds = []) {
  const normalized = normalizeMonsterCollection(collection);
  const requestedIds = new Set(Array.isArray(monsterIds) ? monsterIds : []);
  if (requestedIds.size === 0) return normalized;

  const partyIdSet = new Set(normalized.partyIds.filter(Boolean));
  const transferable = normalized.monsters.filter(monster =>
    requestedIds.has(monster.id) && !partyIdSet.has(monster.id),
  );
  if (transferable.length === 0) return normalized;

  const transferIdSet = new Set(transferable.map(monster => monster.id));
  const professorTransfers = { ...normalized.professorTransfers };
  for (const monster of transferable) {
    professorTransfers[monster.lineId] = (professorTransfers[monster.lineId] ?? 0) + 1;
  }

  return normalizeMonsterCollection({
    ...normalized,
    professorTransfers,
    monsters: normalized.monsters.filter(monster => !transferIdSet.has(monster.id)),
  });
}

export function getTotalProfessorTransfers(collection) {
  const normalized = normalizeMonsterCollection(collection);
  return Object.values(normalized.professorTransfers ?? {}).reduce(
    (sum, count) => sum + Math.max(0, Number(count) || 0),
    0,
  );
}

export function getPendingFossilGift(collection, { unlockedPoolSize = 0, habitatMinPools = {} } = {}) {
  const normalized = normalizeMonsterCollection(collection);
  const poolSize = Math.max(0, Number(unlockedPoolSize) || 0);
  if (poolSize < resolveGiftMinPool(FOSSIL_GIFT_GROUP, habitatMinPools)) return null;
  if (isFossilGiftClaimed(normalized.giftClaims)) return null;
  return FOSSIL_GIFT_GROUP;
}

export function claimFossilGift(collection, lineId, { habitatMinPools = {} } = {}) {
  const normalized = normalizeMonsterCollection(collection);
  const choice = FOSSIL_GIFT_GROUP.choices.find(entry => entry.lineId === lineId);
  if (!choice) return { collection: normalized, awarded: null };
  if (isFossilGiftClaimed(normalized.giftClaims)) return { collection: normalized, awarded: null };

  const giftId = `${FOSSIL_GIFT_GROUP.id}-${choice.lineId}`;
  const level = Math.max(1, Number(FOSSIL_GIFT_GROUP.level) || 1);
  const line = getMonsterLine(choice.lineId);
  const monster = createMonsterInstance({
    id: `gift-${giftId}`,
    lineId: choice.lineId,
    totalXP: totalXPForLevel(level),
    acquiredAt: giftId,
  });

  return {
    collection: normalizeMonsterCollection({
      ...normalized,
      giftClaims: { ...normalized.giftClaims, [giftId]: true },
      monsters: [...normalized.monsters, monster],
    }),
    awarded: {
      id: giftId,
      lineId: choice.lineId,
      trigger: FOSSIL_GIFT_GROUP.trigger,
      location: FOSSIL_GIFT_GROUP.location,
      habitatId: FOSSIL_GIFT_GROUP.habitatId,
      message: choice.message,
      monsterId: monster.id,
      name: line.name,
      sprite: getSpecies(level, choice.lineId).sprite,
    },
  };
}

export function awardEligibleGiftMonsters(
  collection,
  { unlockedPoolSize = 0, trigger = "all", habitatMinPools = {} } = {},
) {
  const normalized = normalizeMonsterCollection(collection);
  const totalTransfers = getTotalProfessorTransfers(normalized);
  const poolSize = Math.max(0, Number(unlockedPoolSize) || 0);
  const nextGiftClaims = { ...normalized.giftClaims };
  const awarded = [];
  const monsters = [...normalized.monsters];

  for (const event of GIFT_MONSTER_EVENTS) {
    if (trigger !== "all" && event.trigger !== trigger) continue;
    if (nextGiftClaims[event.id]) continue;
    if (event.trigger === "professor-transfer" && totalTransfers < event.requiredTransfers) continue;
    if (event.trigger === "pool" && poolSize < resolveGiftMinPool(event, habitatMinPools)) continue;

    const line = getMonsterLine(event.lineId);
    const level = Math.max(1, Number(event.level) || 1);
    const monster = createMonsterInstance({
      id: `gift-${event.id}`,
      lineId: event.lineId,
      totalXP: totalXPForLevel(level),
      acquiredAt: event.id,
    });
    monsters.push(monster);
    nextGiftClaims[event.id] = true;
    awarded.push({
      ...event,
      monsterId: monster.id,
      name: line.name,
      sprite: getSpecies(level, event.lineId).sprite,
    });
  }

  if (awarded.length === 0) {
    return { collection: normalized, awarded };
  }

  return {
    collection: normalizeMonsterCollection({
      ...normalized,
      giftClaims: nextGiftClaims,
      monsters,
    }),
    awarded,
  };
}

export function getGiftToastTitle(gift) {
  if (gift?.trigger === "professor-transfer") return "博士からもらった！";
  return "ポケモンをもらった！";
}

export function totalXPForLevel(level) {
  const cappedLevel = clampLevel(level);
  if (cappedLevel <= 1) return 0;
  return XP_FACTOR * ((cappedLevel - 1) * cappedLevel) / 2;
}

export function xpToNextLevel(level) {
  const cappedLevel = clampLevel(level);
  if (cappedLevel >= MAX_MONSTER_LEVEL) return 0;
  return XP_FACTOR * cappedLevel;
}

export function levelFromTotalXP(xp) {
  const cappedXP = clampMonsterXP(xp);
  const n = Math.floor((1 + Math.sqrt(1 + (8 * cappedXP) / XP_FACTOR)) / 2);
  return clampLevel(n);
}

/** レベルから現在の種族を取得 */
export function getSpecies(level, lineId = DEFAULT_MONSTER_LINE_ID) {
  const line = getMonsterLine(lineId);
  return (
    [...line.species].reverse().find(s => level >= s.minLevel) ??
    line.species[0]
  );
}

/**
 * 累計 XP からモンスターの状態を返す
 * @param {number} totalXP
 * @param {string} lineId
 * @returns {{ level, currentXP, neededXP, pct, species, line }}
 */
export function getMonsterState(totalXP, lineId = DEFAULT_MONSTER_LINE_ID) {
  const cappedXP = clampMonsterXP(totalXP);
  const level = levelFromTotalXP(cappedXP);
  const levelBase = totalXPForLevel(level);
  const currentXP = level >= MAX_MONSTER_LEVEL ? 0 : cappedXP - levelBase;
  const neededXP = xpToNextLevel(level);
  const line = getMonsterLine(lineId);
  const species = getSpecies(level, line.id);
  return {
    level,
    currentXP,
    neededXP,
    pct: level >= MAX_MONSTER_LEVEL ? 1 : currentXP / neededXP,
    species,
    line,
  };
}

const ITEM_EVOLUTION_ITEM_TYPES = {
  cable: "つうしんケーブル",
  fire: "ほのおのいし",
  water: "みずのいし",
  leaf: "リーフのいし",
  thunder: "かみなりのいし",
  moon: "つきのいし",
};

const ITEM_TYPE_WEIGHTS = {
  cable: 6,
  fire: 20,
  leaf: 20,
  water: 20,
  thunder: 20,
  moon: 14,
};

const TRADE_ITEM_EVOLUTIONS = {
  64: 65, // ユンゲラー -> フーディン
  93: 94, // ゴースト -> ゲンガー
  67: 68, // ゴーリキー -> カイリキー
  75: 76, // ゴローン -> ゴローニャ
};

const ITEM_EVO_SPECIES_TARGETS = {
  25: { thunder: 26 }, // ピカチュウ -> ライチュウ
  37: { fire: 38 }, // ロコン -> キュウコン
  58: { fire: 59 }, // ガーディ -> ウインディ
  44: { leaf: 45 }, // クサイハナ -> ラフレシア
  70: { leaf: 71 }, // ウツドン -> ウツボット
 102: { leaf: 103 }, // タマタマ -> ナッシー
  61: { water: 62 }, // ニョロゾ -> ニョロボン
  90: { water: 91 }, // シェルダー -> パルシェン
 120: { water: 121 }, // ヒトデマン -> スターミー
  39: { moon: 40 }, // プリン -> プクリン
  35: { moon: 36 }, // ピッピ -> ピクシー
  30: { moon: 31 }, // ニドリーナ -> ニドクイン
  33: { moon: 34 }, // ニドリーノ -> ニドキング
 133: { fire: 136, water: 134, thunder: 135 }, // イーブイ
};

const SPECIES_BY_ID = new Map(MONSTER_LINES.flatMap(line => line.species).map(s => [s.id, s]));

export function getSpeciesById(speciesId) {
  return SPECIES_BY_ID.get(Number(speciesId)) ?? null;
}

export function getMonsterDisplayState(monster) {
  if (!monster || typeof monster !== "object") {
    return getMonsterState(0, DEFAULT_MONSTER_LINE_ID);
  }
  const state = getMonsterState(monster.totalXP, monster.lineId);
  if (Number.isFinite(Number(monster.forcedSpeciesId))) {
    const forcedSpecies = getSpeciesById(monster.forcedSpeciesId);
    if (forcedSpecies) {
      return {
        ...state,
        species: forcedSpecies,
      };
    }
  }
  return state;
}

export function getItemEvolutionTypesForSpecies(speciesId) {
  const parsedId = Number(speciesId);
  if (Object.prototype.hasOwnProperty.call(TRADE_ITEM_EVOLUTIONS, parsedId)) {
    return ["cable"];
  }
  if (Object.prototype.hasOwnProperty.call(ITEM_EVO_SPECIES_TARGETS, parsedId)) {
    return Object.keys(ITEM_EVO_SPECIES_TARGETS[parsedId]);
  }
  return [];
}

export function getItemEvolutionName(itemType) {
  return ITEM_EVOLUTION_ITEM_TYPES[itemType] ?? null;
}

export function getItemEvolutionTargetSpeciesId(speciesId, itemType) {
  const parsedId = Number(speciesId);
  if (Object.prototype.hasOwnProperty.call(TRADE_ITEM_EVOLUTIONS, parsedId) && itemType === "cable") {
    return TRADE_ITEM_EVOLUTIONS[parsedId];
  }
  const targets = ITEM_EVO_SPECIES_TARGETS[parsedId];
  return targets ? targets[itemType] ?? null : null;
}

export function getItemEvolutionCandidates(collection, partyOnly = true) {
  const normalized = normalizeMonsterCollection(collection);
  const candidates = [];
  const partyIds = new Set(partyOnly ? normalized.partyIds.filter(Boolean) : normalized.monsters.map(m => m.id));
  for (const monster of normalized.monsters) {
    if (!partyIds.has(monster.id)) continue;
    if (monster.heldItemType) continue;
    const state = getMonsterDisplayState(monster);
    const itemTypes = getItemEvolutionTypesForSpecies(state.species.id);
    if (itemTypes.length > 0) {
      candidates.push({ monster, itemTypes });
    }
  }
  return candidates;
}

export function getItemEvolutionPickup(collection, rng = Math.random) {
  const candidates = getItemEvolutionCandidates(collection, true);
  if (candidates.length === 0) return null;

  const buckets = new Map();
  for (const { monster, itemTypes } of candidates) {
    for (const itemType of itemTypes) {
      const current = buckets.get(itemType) ?? [];
      current.push(monster);
      buckets.set(itemType, current);
    }
  }

  // Select the item type by absolute rarity weights first; if the chosen type has no
  // eligible monster, the play yields no item pickup instead of forcing a lower-rarity drop.
  const weighted = Object.entries(ITEM_TYPE_WEIGHTS)
    .map(([itemType, weight]) => ({ itemType, weight }))
    .filter(entry => entry.weight > 0);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return null;

  let cursor = rng() * total;
  let chosenItemType = weighted[weighted.length - 1].itemType;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      chosenItemType = entry.itemType;
      break;
    }
  }

  const eligibleMonsters = buckets.get(chosenItemType) ?? [];
  if (eligibleMonsters.length === 0) return null;

  const chosenMonster = eligibleMonsters[Math.floor(rng() * eligibleMonsters.length)];
  const itemName = getItemEvolutionName(chosenItemType);
  if (!itemName) return null;

  return {
    monsterId: chosenMonster.id,
    itemType: chosenItemType,
    itemName,
  };
}

export function getItemEvolutionCandidateTypes(collection) {
  return getItemEvolutionCandidates(collection, true)
    .flatMap(candidate => candidate.itemTypes)
    .filter((value, index, self) => self.indexOf(value) === index);
}

export function getXpForLevel(level) {
  return totalXPForLevel(level);
}

/**
 * レベルに応じたステータスボーナスを計算
 * 最終進化後も育成する意味を持たせるために、
 * レベルアップでステータスが向上することを表示
 * @param {number} level
 * @returns {{ hp, attack, defense, spAtk, spDef, speed }}
 */
export function getMonsterStatBonus(level) {
  const clampedLevel = clampLevel(level);
  // レベル1を基本(100)として、レベルごとに約3.4%成長
  // Lv.99時には約3倍になる計算
  const statMultiplier = Math.pow((clampedLevel / 1), 0.035);
  const baseStat = 100;
  
  return {
    hp: Math.floor(baseStat * statMultiplier),
    attack: Math.floor(baseStat * statMultiplier),
    defense: Math.floor(baseStat * statMultiplier),
    spAtk: Math.floor(baseStat * statMultiplier),
    spDef: Math.floor(baseStat * statMultiplier),
    speed: Math.floor(baseStat * statMultiplier),
  };
}

/**
 * レベルアップ時の成長率を返す
 * 学習への動機づけのため、レベルが上がる喜びを表示
 * @param {number} fromLevel 
 * @param {number} toLevel
 * @returns {{ statName, bonus }}[]
 */
export function getLevelUpGrowth(fromLevel, toLevel) {
  if (fromLevel >= toLevel) return [];
  
  const fromStats = getMonsterStatBonus(fromLevel);
  const toStats = getMonsterStatBonus(toLevel);
  
  return [
    { statName: "HP", bonus: toStats.hp - fromStats.hp },
    { statName: "攻撃", bonus: toStats.attack - fromStats.attack },
    { statName: "防御", bonus: toStats.defense - fromStats.defense },
    { statName: "特攻", bonus: toStats.spAtk - fromStats.spAtk },
    { statName: "特防", bonus: toStats.spDef - fromStats.spDef },
    { statName: "素早さ", bonus: toStats.speed - fromStats.speed },
  ];
}
