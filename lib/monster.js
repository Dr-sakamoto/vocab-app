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
const goldSprite = id => `${SPRITE_ROOT}/crystal/animated/${id}.gif`;

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
  {
    id: "bulbasaur",
    name: "フシギダネ",
    species: [
      species({ id: 1, name: "フシギダネ", nameEn: "Bulbasaur", minLevel: 1, maxLevel: 15 }),
      species({ id: 2, name: "フシギソウ", nameEn: "Ivysaur", minLevel: 16, maxLevel: 31 }),
      species({ id: 3, name: "フシギバナ", nameEn: "Venusaur", minLevel: 32 }),
    ],
  },
  {
    id: "charmander",
    name: "ヒトカゲ",
    species: [
      species({ id: 4, name: "ヒトカゲ", nameEn: "Charmander", minLevel: 1, maxLevel: 15 }),
      species({ id: 5, name: "リザード", nameEn: "Charmeleon", minLevel: 16, maxLevel: 35 }),
      species({ id: 6, name: "リザードン", nameEn: "Charizard", minLevel: 36 }),
    ],
  },
  {
    id: "squirtle",
    name: "ゼニガメ",
    species: [
      species({ id: 7, name: "ゼニガメ", nameEn: "Squirtle", minLevel: 1, maxLevel: 15 }),
      species({ id: 8, name: "カメール", nameEn: "Wartortle", minLevel: 16, maxLevel: 35 }),
      species({ id: 9, name: "カメックス", nameEn: "Blastoise", minLevel: 36 }),
    ],
  },
  {
    id: "caterpie",
    name: "キャタピー",
    species: [
      species({ id: 10, name: "キャタピー", nameEn: "Caterpie", minLevel: 1, maxLevel: 6 }),
      species({ id: 11, name: "トランセル", nameEn: "Metapod", minLevel: 7, maxLevel: 9 }),
      species({ id: 12, name: "バタフリー", nameEn: "Butterfree", minLevel: 10 }),
    ],
  },
  {
    id: "weedle",
    name: "ビードル",
    species: [
      species({ id: 13, name: "ビードル", nameEn: "Weedle", minLevel: 1, maxLevel: 6 }),
      species({ id: 14, name: "コクーン", nameEn: "Kakuna", minLevel: 7, maxLevel: 9 }),
      species({ id: 15, name: "スピアー", nameEn: "Beedrill", minLevel: 10 }),
    ],
  },
  {
    id: "pidgey",
    name: "ポッポ",
    species: [
      species({ id: 16, name: "ポッポ", nameEn: "Pidgey", minLevel: 1, maxLevel: 17 }),
      species({ id: 17, name: "ピジョン", nameEn: "Pidgeotto", minLevel: 18, maxLevel: 35 }),
      species({ id: 18, name: "ピジョット", nameEn: "Pidgeot", minLevel: 36 }),
    ],
  },
  {
    id: "rattata",
    name: "コラッタ",
    species: [
      species({ id: 19, name: "コラッタ", nameEn: "Rattata", minLevel: 1, maxLevel: 19 }),
      species({ id: 20, name: "ラッタ", nameEn: "Raticate", minLevel: 20 }),
    ],
  },
  {
    id: "spearow",
    name: "オニスズメ",
    species: [
      species({ id: 21, name: "オニスズメ", nameEn: "Spearow", minLevel: 1, maxLevel: 19 }),
      species({ id: 22, name: "オニドリル", nameEn: "Fearow", minLevel: 20 }),
    ],
  },
  {
    id: "ekans",
    name: "アーボ",
    species: [
      species({ id: 23, name: "アーボ", nameEn: "Ekans", minLevel: 1, maxLevel: 21 }),
      species({ id: 24, name: "アーボック", nameEn: "Arbok", minLevel: 22 }),
    ],
  },
  {
    id: "pikachu",
    name: "ピカチュウ",
    species: [
      species({ id: 25, name: "ピカチュウ", nameEn: "Pikachu", minLevel: 1, maxLevel: 98 }),
      species({ id: 26, name: "ライチュウ", nameEn: "Raichu", minLevel: 99 }),
    ],
  },
  {
    id: "sandshrew",
    name: "サンド",
    species: [
      species({ id: 27, name: "サンド", nameEn: "Sandshrew", minLevel: 1, maxLevel: 21 }),
      species({ id: 28, name: "サンドパン", nameEn: "Sandslash", minLevel: 22 }),
    ],
  },
  {
    id: "nidoran-f",
    name: "ニドラン♀",
    species: [
      species({ id: 29, name: "ニドラン♀", nameEn: "Nidoran F", minLevel: 1, maxLevel: 15 }),
      species({ id: 30, name: "ニドリーナ", nameEn: "Nidorina", minLevel: 16, maxLevel: 98 }),
      species({ id: 31, name: "ニドクイン", nameEn: "Nidoqueen", minLevel: 99 }),
    ],
  },
  {
    id: "nidoran-m",
    name: "ニドラン♂",
    species: [
      species({ id: 32, name: "ニドラン♂", nameEn: "Nidoran M", minLevel: 1, maxLevel: 15 }),
      species({ id: 33, name: "ニドリーノ", nameEn: "Nidorino", minLevel: 16, maxLevel: 98 }),
      species({ id: 34, name: "ニドキング", nameEn: "Nidoking", minLevel: 99 }),
    ],
  },
  {
    id: "clefairy",
    name: "ピッピ",
    species: [
      species({ id: 35, name: "ピッピ", nameEn: "Clefairy", minLevel: 1, maxLevel: 98 }),
      species({ id: 36, name: "ピクシー", nameEn: "Clefable", minLevel: 99 }),
    ],
  },
  {
    id: "vulpix",
    name: "ロコン",
    species: [
      species({ id: 37, name: "ロコン", nameEn: "Vulpix", minLevel: 1, maxLevel: 98 }),
      species({ id: 38, name: "キュウコン", nameEn: "Ninetales", minLevel: 99 }),
    ],
  },
  {
    id: "jigglypuff",
    name: "プリン",
    species: [
      species({ id: 39, name: "プリン", nameEn: "Jigglypuff", minLevel: 1, maxLevel: 98 }),
      species({ id: 40, name: "プクリン", nameEn: "Wigglytuff", minLevel: 99 }),
    ],
  },
  {
    id: "zubat",
    name: "ズバット",
    species: [
      species({ id: 41, name: "ズバット", nameEn: "Zubat", minLevel: 1, maxLevel: 21 }),
      species({ id: 42, name: "ゴルバット", nameEn: "Golbat", minLevel: 22 }),
    ],
  },
  {
    id: "oddish",
    name: "ナゾノクサ",
    species: [
      species({ id: 43, name: "ナゾノクサ", nameEn: "Oddish", minLevel: 1, maxLevel: 20 }),
      species({ id: 44, name: "クサイハナ", nameEn: "Gloom", minLevel: 21, maxLevel: 98 }),
      species({ id: 45, name: "ラフレシア", nameEn: "Vileplume", minLevel: 99 }),
    ],
  },
  {
    id: "paras",
    name: "パラス",
    species: [
      species({ id: 46, name: "パラス", nameEn: "Paras", minLevel: 1, maxLevel: 23 }),
      species({ id: 47, name: "パラセクト", nameEn: "Parasect", minLevel: 24 }),
    ],
  },
  {
    id: "venonat",
    name: "コンパン",
    species: [
      species({ id: 48, name: "コンパン", nameEn: "Venonat", minLevel: 1, maxLevel: 30 }),
      species({ id: 49, name: "モルフォン", nameEn: "Venomoth", minLevel: 31 }),
    ],
  },
  {
    id: "diglett",
    name: "ディグダ",
    species: [
      species({ id: 50, name: "ディグダ", nameEn: "Diglett", minLevel: 1, maxLevel: 25 }),
      species({ id: 51, name: "ダグトリオ", nameEn: "Dugtrio", minLevel: 26 }),
    ],
  },
  {
    id: "meowth",
    name: "ニャース",
    species: [
      species({ id: 52, name: "ニャース", nameEn: "Meowth", minLevel: 1, maxLevel: 27 }),
      species({ id: 53, name: "ペルシアン", nameEn: "Persian", minLevel: 28 }),
    ],
  },
  {
    id: "psyduck",
    name: "コダック",
    species: [
      species({ id: 54, name: "コダック", nameEn: "Psyduck", minLevel: 1, maxLevel: 32 }),
      species({ id: 55, name: "ゴルダック", nameEn: "Golduck", minLevel: 33 }),
    ],
  },
  {
    id: "mankey",
    name: "マンキー",
    species: [
      species({ id: 56, name: "マンキー", nameEn: "Mankey", minLevel: 1, maxLevel: 27 }),
      species({ id: 57, name: "オコリザル", nameEn: "Primeape", minLevel: 28 }),
    ],
  },
  {
    id: "growlithe",
    name: "ガーディ",
    species: [
      species({ id: 58, name: "ガーディ", nameEn: "Growlithe", minLevel: 1, maxLevel: 98 }),
      species({ id: 59, name: "ウインディ", nameEn: "Arcanine", minLevel: 99 }),
    ],
  },
  {
    id: "poliwag",
    name: "ニョロモ",
    species: [
      species({ id: 60, name: "ニョロモ", nameEn: "Poliwag", minLevel: 1, maxLevel: 24 }),
      species({ id: 61, name: "ニョロゾ", nameEn: "Poliwhirl", minLevel: 25, maxLevel: 98 }),
      species({ id: 62, name: "ニョロボン", nameEn: "Poliwrath", minLevel: 99 }),
    ],
  },
  {
    id: "abra",
    name: "ケーシィ",
    species: [
      species({ id: 63, name: "ケーシィ", nameEn: "Abra", minLevel: 1, maxLevel: 15 }),
      species({ id: 64, name: "ユンゲラー", nameEn: "Kadabra", minLevel: 16, maxLevel: 98 }),
      species({ id: 65, name: "フーディン", nameEn: "Alakazam", minLevel: 99 }),
    ],
  },
  {
    id: "machop",
    name: "ワンリキー",
    species: [
      species({ id: 66, name: "ワンリキー", nameEn: "Machop", minLevel: 1, maxLevel: 27 }),
      species({ id: 67, name: "ゴーリキー", nameEn: "Machoke", minLevel: 28, maxLevel: 98 }),
      species({ id: 68, name: "カイリキー", nameEn: "Machamp", minLevel: 99 }),
    ],
  },
  {
    id: "bellsprout",
    name: "マダツボミ",
    species: [
      species({ id: 69, name: "マダツボミ", nameEn: "Bellsprout", minLevel: 1, maxLevel: 20 }),
      species({ id: 70, name: "ウツドン", nameEn: "Weepinbell", minLevel: 21, maxLevel: 98 }),
      species({ id: 71, name: "ウツボット", nameEn: "Victreebel", minLevel: 99 }),
    ],
  },
  {
    id: "tentacool",
    name: "メノクラゲ",
    species: [
      species({ id: 72, name: "メノクラゲ", nameEn: "Tentacool", minLevel: 1, maxLevel: 29 }),
      species({ id: 73, name: "ドククラゲ", nameEn: "Tentacruel", minLevel: 30 }),
    ],
  },
  {
    id: "geodude",
    name: "イシツブテ",
    species: [
      species({ id: 74, name: "イシツブテ", nameEn: "Geodude", minLevel: 1, maxLevel: 24 }),
      species({ id: 75, name: "ゴローン", nameEn: "Graveler", minLevel: 25, maxLevel: 98 }),
      species({ id: 76, name: "ゴローニャ", nameEn: "Golem", minLevel: 99 }),
    ],
  },
  {
    id: "ponyta",
    name: "ポニータ",
    species: [
      species({ id: 77, name: "ポニータ", nameEn: "Ponyta", minLevel: 1, maxLevel: 39 }),
      species({ id: 78, name: "ギャロップ", nameEn: "Rapidash", minLevel: 40 }),
    ],
  },
  {
    id: "slowpoke",
    name: "ヤドン",
    species: [
      species({ id: 79, name: "ヤドン", nameEn: "Slowpoke", minLevel: 1, maxLevel: 36 }),
      species({ id: 80, name: "ヤドラン", nameEn: "Slowbro", minLevel: 37 }),
    ],
  },
  {
    id: "magnemite",
    name: "コイル",
    species: [
      species({ id: 81, name: "コイル", nameEn: "Magnemite", minLevel: 1, maxLevel: 29 }),
      species({ id: 82, name: "レアコイル", nameEn: "Magneton", minLevel: 30 }),
    ],
  },
  {
    id: "farfetchd",
    name: "カモネギ",
    species: [
      species({ id: 83, name: "カモネギ", nameEn: "Farfetch'd", minLevel: 1 }),
    ],
  },
  {
    id: "doduo",
    name: "ドードー",
    species: [
      species({ id: 84, name: "ドードー", nameEn: "Doduo", minLevel: 1, maxLevel: 30 }),
      species({ id: 85, name: "ドードリオ", nameEn: "Dodrio", minLevel: 31 }),
    ],
  },
  {
    id: "seel",
    name: "パウワウ",
    species: [
      species({ id: 86, name: "パウワウ", nameEn: "Seel", minLevel: 1, maxLevel: 33 }),
      species({ id: 87, name: "ジュゴン", nameEn: "Dewgong", minLevel: 34 }),
    ],
  },
  {
    id: "grimer",
    name: "ベトベター",
    species: [
      species({ id: 88, name: "ベトベター", nameEn: "Grimer", minLevel: 1, maxLevel: 37 }),
      species({ id: 89, name: "ベトベトン", nameEn: "Muk", minLevel: 38 }),
    ],
  },
  {
    id: "shellder",
    name: "シェルダー",
    species: [
      species({ id: 90, name: "シェルダー", nameEn: "Shellder", minLevel: 1, maxLevel: 98 }),
      species({ id: 91, name: "パルシェン", nameEn: "Cloyster", minLevel: 99 }),
    ],
  },
  {
    id: "gastly",
    name: "ゴース",
    species: [
      species({ id: 92, name: "ゴース", nameEn: "Gastly", minLevel: 1, maxLevel: 24 }),
      species({ id: 93, name: "ゴースト", nameEn: "Haunter", minLevel: 25, maxLevel: 98 }),
      species({ id: 94, name: "ゲンガー", nameEn: "Gengar", minLevel: 99 }),
    ],
  },
  {
    id: "onix",
    name: "イワーク",
    species: [
      species({ id: 95, name: "イワーク", nameEn: "Onix", minLevel: 1 }),
    ],
  },
  {
    id: "drowzee",
    name: "スリープ",
    species: [
      species({ id: 96, name: "スリープ", nameEn: "Drowzee", minLevel: 1, maxLevel: 25 }),
      species({ id: 97, name: "スリーパー", nameEn: "Hypno", minLevel: 26 }),
    ],
  },
  {
    id: "krabby",
    name: "クラブ",
    species: [
      species({ id: 98, name: "クラブ", nameEn: "Krabby", minLevel: 1, maxLevel: 27 }),
      species({ id: 99, name: "キングラー", nameEn: "Kingler", minLevel: 28 }),
    ],
  },
  {
    id: "voltorb",
    name: "ビリリダマ",
    species: [
      species({ id: 100, name: "ビリリダマ", nameEn: "Voltorb", minLevel: 1, maxLevel: 29 }),
      species({ id: 101, name: "マルマイン", nameEn: "Electrode", minLevel: 30 }),
    ],
  },
  {
    id: "exeggcute",
    name: "タマタマ",
    species: [
      species({ id: 102, name: "タマタマ", nameEn: "Exeggcute", minLevel: 1, maxLevel: 98 }),
      species({ id: 103, name: "ナッシー", nameEn: "Exeggutor", minLevel: 99 }),
    ],
  },
  {
    id: "cubone",
    name: "カラカラ",
    species: [
      species({ id: 104, name: "カラカラ", nameEn: "Cubone", minLevel: 1, maxLevel: 27 }),
      species({ id: 105, name: "ガラガラ", nameEn: "Marowak", minLevel: 28 }),
    ],
  },
  {
    id: "hitmonlee",
    name: "サワムラー",
    species: [
      species({ id: 106, name: "サワムラー", nameEn: "Hitmonlee", minLevel: 1 }),
    ],
  },
  {
    id: "hitmonchan",
    name: "エビワラー",
    species: [
      species({ id: 107, name: "エビワラー", nameEn: "Hitmonchan", minLevel: 1 }),
    ],
  },
  {
    id: "lickitung",
    name: "ベロリンガ",
    species: [
      species({ id: 108, name: "ベロリンガ", nameEn: "Lickitung", minLevel: 1 }),
    ],
  },
  {
    id: "koffing",
    name: "ドガース",
    species: [
      species({ id: 109, name: "ドガース", nameEn: "Koffing", minLevel: 1, maxLevel: 34 }),
      species({ id: 110, name: "マタドガス", nameEn: "Weezing", minLevel: 35 }),
    ],
  },
  {
    id: "rhyhorn",
    name: "サイホーン",
    species: [
      species({ id: 111, name: "サイホーン", nameEn: "Rhyhorn", minLevel: 1, maxLevel: 41 }),
      species({ id: 112, name: "サイドン", nameEn: "Rhydon", minLevel: 42 }),
    ],
  },
  {
    id: "chansey",
    name: "ラッキー",
    species: [
      species({ id: 113, name: "ラッキー", nameEn: "Chansey", minLevel: 1 }),
    ],
  },
  {
    id: "tangela",
    name: "モンジャラ",
    species: [
      species({ id: 114, name: "モンジャラ", nameEn: "Tangela", minLevel: 1 }),
    ],
  },
  {
    id: "kangaskhan",
    name: "ガルーラ",
    species: [
      species({ id: 115, name: "ガルーラ", nameEn: "Kangaskhan", minLevel: 1 }),
    ],
  },
  {
    id: "horsea",
    name: "タッツー",
    species: [
      species({ id: 116, name: "タッツー", nameEn: "Horsea", minLevel: 1, maxLevel: 31 }),
      species({ id: 117, name: "シードラ", nameEn: "Seadra", minLevel: 32 }),
    ],
  },
  {
    id: "goldeen",
    name: "トサキント",
    species: [
      species({ id: 118, name: "トサキント", nameEn: "Goldeen", minLevel: 1, maxLevel: 32 }),
      species({ id: 119, name: "アズマオウ", nameEn: "Seaking", minLevel: 33 }),
    ],
  },
  {
    id: "staryu",
    name: "ヒトデマン",
    species: [
      species({ id: 120, name: "ヒトデマン", nameEn: "Staryu", minLevel: 1, maxLevel: 98 }),
      species({ id: 121, name: "スターミー", nameEn: "Starmie", minLevel: 99 }),
    ],
  },
  {
    id: "mr-mime",
    name: "バリヤード",
    species: [
      species({ id: 122, name: "バリヤード", nameEn: "Mr. Mime", minLevel: 1 }),
    ],
  },
  {
    id: "scyther",
    name: "ストライク",
    species: [
      species({ id: 123, name: "ストライク", nameEn: "Scyther", minLevel: 1 }),
    ],
  },
  {
    id: "jynx",
    name: "ルージュラ",
    species: [
      species({ id: 124, name: "ルージュラ", nameEn: "Jynx", minLevel: 1 }),
    ],
  },
  {
    id: "electabuzz",
    name: "エレブー",
    species: [
      species({ id: 125, name: "エレブー", nameEn: "Electabuzz", minLevel: 1 }),
    ],
  },
  {
    id: "magmar",
    name: "ブーバー",
    species: [
      species({ id: 126, name: "ブーバー", nameEn: "Magmar", minLevel: 1 }),
    ],
  },
  {
    id: "pinsir",
    name: "カイロス",
    species: [
      species({ id: 127, name: "カイロス", nameEn: "Pinsir", minLevel: 1 }),
    ],
  },
  {
    id: "tauros",
    name: "ケンタロス",
    species: [
      species({ id: 128, name: "ケンタロス", nameEn: "Tauros", minLevel: 1 }),
    ],
  },
  {
    id: "magikarp",
    name: "コイキング",
    species: [
      species({ id: 129, name: "コイキング", nameEn: "Magikarp", minLevel: 1, maxLevel: 19 }),
      species({ id: 130, name: "ギャラドス", nameEn: "Gyarados", minLevel: 20 }),
    ],
  },
  {
    id: "lapras",
    name: "ラプラス",
    species: [
      species({ id: 131, name: "ラプラス", nameEn: "Lapras", minLevel: 1 }),
    ],
  },
  {
    id: "ditto",
    name: "メタモン",
    species: [
      species({ id: 132, name: "メタモン", nameEn: "Ditto", minLevel: 1 }),
    ],
  },
  {
    id: "eevee",
    name: "イーブイ",
    species: [
      species({ id: 133, name: "イーブイ", nameEn: "Eevee", minLevel: 1 }),
    ],
  },
  {
    id: "vaporeon",
    name: "シャワーズ",
    species: [
      species({ id: 134, name: "シャワーズ", nameEn: "Vaporeon", minLevel: 1 }),
    ],
  },
  {
    id: "jolteon",
    name: "サンダース",
    species: [
      species({ id: 135, name: "サンダース", nameEn: "Jolteon", minLevel: 1 }),
    ],
  },
  {
    id: "flareon",
    name: "ブースター",
    species: [
      species({ id: 136, name: "ブースター", nameEn: "Flareon", minLevel: 1 }),
    ],
  },
  {
    id: "porygon",
    name: "ポリゴン",
    species: [
      species({ id: 137, name: "ポリゴン", nameEn: "Porygon", minLevel: 1 }),
    ],
  },
  {
    id: "omanyte",
    name: "オムナイト",
    species: [
      species({ id: 138, name: "オムナイト", nameEn: "Omanyte", minLevel: 1, maxLevel: 39 }),
      species({ id: 139, name: "オムスター", nameEn: "Omastar", minLevel: 40 }),
    ],
  },
  {
    id: "kabuto",
    name: "カブト",
    species: [
      species({ id: 140, name: "カブト", nameEn: "Kabuto", minLevel: 1, maxLevel: 39 }),
      species({ id: 141, name: "カブトプス", nameEn: "Kabutops", minLevel: 40 }),
    ],
  },
  {
    id: "aerodactyl",
    name: "プテラ",
    species: [
      species({ id: 142, name: "プテラ", nameEn: "Aerodactyl", minLevel: 1 }),
    ],
  },
  {
    id: "snorlax",
    name: "カビゴン",
    species: [
      species({ id: 143, name: "カビゴン", nameEn: "Snorlax", minLevel: 1 }),
    ],
  },
  {
    id: "articuno",
    name: "フリーザー",
    species: [
      species({ id: 144, name: "フリーザー", nameEn: "Articuno", minLevel: 1 }),
    ],
  },
  {
    id: "zapdos",
    name: "サンダー",
    species: [
      species({ id: 145, name: "サンダー", nameEn: "Zapdos", minLevel: 1 }),
    ],
  },
  {
    id: "moltres",
    name: "ファイヤー",
    species: [
      species({ id: 146, name: "ファイヤー", nameEn: "Moltres", minLevel: 1 }),
    ],
  },
  {
    id: "dratini",
    name: "ミニリュウ",
    species: [
      species({ id: 147, name: "ミニリュウ", nameEn: "Dratini", minLevel: 1, maxLevel: 29 }),
      species({ id: 148, name: "ハクリュー", nameEn: "Dragonair", minLevel: 30, maxLevel: 54 }),
      species({ id: 149, name: "カイリュー", nameEn: "Dragonite", minLevel: 55 }),
    ],
  },
  {
    id: "mewtwo",
    name: "ミュウツー",
    species: [
      species({ id: 150, name: "ミュウツー", nameEn: "Mewtwo", minLevel: 1 }),
    ],
  },
  {
    id: "mew",
    name: "ミュウ",
    species: [
      species({ id: 151, name: "ミュウ", nameEn: "Mew", minLevel: 1 }),
    ],
  },
  {
    id: "wobbuffet",
    name: "Wobbuffet",
    species: [
      species({ id: 202, name: "Wobbuffet", nameEn: "Wobbuffet", minLevel: 1 }),
    ],
  },
];



export const DEFAULT_MONSTER_LINE_ID = "bulbasaur";
export const BULBASAUR_LINE = MONSTER_LINES.find(line => line.id === DEFAULT_MONSTER_LINE_ID).species;
export const PARTY_SIZE = 6;
export const BOX_LIMIT = 500;
export const DEFAULT_MONSTER_COLLECTION = {
  version: 1,
  activeId: "starter-bulbasaur",
  partyIds: ["starter-bulbasaur", "starter-charmander", "starter-squirtle", null, null, null],
  habitatVisits: {},
  professorTransfers: {},
  monsters: [
    { id: "starter-charmander", lineId: "charmander", totalXP: 0 },
    { id: "starter-squirtle", lineId: "squirtle", totalXP: 0 },
    { id: "starter-bulbasaur", lineId: "bulbasaur", totalXP: 0 },
  ],
};

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
} = {}) {
  const safeLineId = normalizeMonsterLineId(lineId);
  return {
    id: id ?? `${safeLineId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    lineId: safeLineId,
    totalXP: clampMonsterXP(totalXP),
    acquiredAt,
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
    });
    byId.set(instance.id, instance);
  }

  for (const starter of DEFAULT_MONSTER_COLLECTION.monsters) {
    if (!byId.has(starter.id)) byId.set(starter.id, createMonsterInstance(starter));
  }

  const monsters = Array.from(byId.values());
  const requestedActiveId = collection?.activeId;
  const fallbackActiveId =
    monsters.find(monster => monster.lineId === legacyLineId)?.id ??
    DEFAULT_MONSTER_COLLECTION.activeId;
  const activeId = monsters.some(monster => monster.id === requestedActiveId)
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
  if (nonEmptyPartyIds.length === 0) {
    partyIds[0] = activeId;
  } else if (!partyIds.includes(activeId)) {
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

  return { version: 1, activeId: partyIds[0] ?? activeId, partyIds, habitatVisits, professorTransfers, monsters };
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
      return {
        ...monster,
        totalXP: clampMonsterXP(monster.totalXP + xpToAdd),
      };
    }),
  };
}

export function getBoxMonsters(collection) {
  const normalized = normalizeMonsterCollection(collection);
  const partyIdSet = new Set(normalized.partyIds);
  return normalized.monsters.filter(monster => !partyIdSet.has(monster.id));
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
// monster.js に実装するイメージ（既存のgetMonsterStateの逆のロジック）
export function getXpForLevel(level, lineId) {
  // lineId からそのポケモンの「経験値タイプ（普通、遅いなど）」を取得
  // 例として「中速（Lvの3乗）」の場合:
  return Math.pow(level, 3); 
}
