import {
  PoolTier,
  Species,
  MonsterLine,
  MonsterInstance,
  MonsterCollection,
  StoryProgress,
} from "./types.js";

// プール倍率ティア（全3400語対応）
export const POOL_TIERS: PoolTier[] = [
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
export function getPoolTier(poolSize: number): PoolTier {
  return POOL_TIERS.find(t => poolSize >= t.minPool) ?? POOL_TIERS.at(-1)!;
}

/** speciesId（図鑑番号）から lineId を逆引き */
export function getLineIdBySpeciesId(speciesId: number): string {
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

const crystalSprite = (id: number) => `${SPRITE_ROOT}/crystal/animated/${id}.gif`;
const goldSprite = (id: number) => `${SPRITE_ROOT}/yellow/transparent/${id}.png`;

interface SpeciesParams {
  id: number;
  name: string;
  nameEn: string;
  minLevel: number;
  maxLevel?: number;
}

function species({ id, name, nameEn, minLevel, maxLevel = MAX_MONSTER_LEVEL }: SpeciesParams): Species {
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

export const MONSTER_LINES: MonsterLine[] = [
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
];

export const DEFAULT_MONSTER_LINE_ID = "bulbasaur";
export const BULBASAUR_LINE = MONSTER_LINES.find(line => line.id === DEFAULT_MONSTER_LINE_ID)!.species;
export const PARTY_SIZE = 6;
export const BOX_LIMIT = 500;
export const DEFAULT_MONSTER_COLLECTION: MonsterCollection = {
  version: 1,
  activeId: null,
  partyIds: [null, null, null, null, null, null],
  habitatVisits: {},
  professorTransfers: {},
  giftClaims: {},
  monsters: [],
};

export interface GiftMonsterEvent {
  id: string;
  lineId: string;
  level: number;
  trigger: "professor-transfer" | "pool";
  requiredTransfers?: number;
  location: string;
  message: string;
  habitatId?: string;
  minPool?: number;
}

export const GIFT_MONSTER_EVENTS: GiftMonsterEvent[] = [
  {
    id: "professor-farfetchd-50",
    lineId: "farfetchd",
    level: 20,
    trigger: "professor-transfer",
    requiredTransfers: 50,
    location: "クチバシティ",
    message: "博士からカモネギをもらった！",
  },
  {
    id: "professor-mr-mime-100",
    lineId: "mr-mime",
    level: 20,
    trigger: "professor-transfer",
    requiredTransfers: 100,
    location: "2ばんどうろ",
    message: "博士からバリヤードをもらった！",
  },
  {
    id: "professor-lickitung-120",
    lineId: "lickitung",
    level: 25,
    trigger: "professor-transfer",
    requiredTransfers: 120,
    location: "18ばんどうろ",
    message: "博士からベロリンガをもらった！",
  },
  {
    id: "professor-jynx-150",
    lineId: "jynx",
    level: 25,
    trigger: "professor-transfer",
    requiredTransfers: 150,
    location: "ハナダシティ",
    message: "博士からルージュラをもらった！",
  },
  {
    id: "celadon-eevee",
    lineId: "eevee",
    level: 25,
    trigger: "pool",
    habitatId: "route-7",
    location: "タマムシシティ",
    message: "タマムシシティでイーブイをもらった！",
  },
  {
    id: "celadon-porygon",
    lineId: "porygon",
    level: 26,
    trigger: "pool",
    habitatId: "route-7",
    location: "タマムシシティ",
    message: "ゲームコーナーでポリゴンをもらった！",
  },
  {
    id: "silph-lapras",
    lineId: "lapras",
    level: 15,
    trigger: "pool",
    habitatId: "pokemon-tower",
    location: "シルフカンパニー",
    message: "シルフカンパニーでラプラスをもらった！",
  },
];

export interface FossilChoice {
  lineId: string;
  message: string;
}

export interface FossilGiftGroup {
  id: string;
  trigger: "pool";
  habitatId: string;
  location: string;
  level: number;
  choices: FossilChoice[];
}

export const FOSSIL_GIFT_GROUP: FossilGiftGroup = {
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

function resolveGiftMinPool(event: GiftMonsterEvent | FossilGiftGroup, habitatMinPools: Record<string, number> = {}): number {
  if (Number.isFinite(Number((event as any).minPool))) return Number((event as any).minPool);
  if (typeof event.habitatId === "string" && Number.isFinite(Number(habitatMinPools[event.habitatId]))) {
    return Number(habitatMinPools[event.habitatId]);
  }
  return Infinity;
}

function isFossilGiftClaimed(giftClaims: Record<string, boolean> = {}): boolean {
  return FOSSIL_GIFT_GROUP.choices.some(choice => giftClaims[`${FOSSIL_GIFT_GROUP.id}-${choice.lineId}`]);
}

const MONSTER_LINE_BY_ID = new Map<string, MonsterLine>(MONSTER_LINES.map(line => [line.id, line]));

function clampLevel(level: number | string): number {
  const n = Number(level);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_MONSTER_LEVEL, Math.floor(n)));
}

export function clampMonsterXP(xp: number | string | null | undefined): number {
  const n = Number(xp);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_MONSTER_XP, n));
}

export function normalizeMonsterLineId(lineId: string | null | undefined): string {
  return lineId && MONSTER_LINE_BY_ID.has(lineId) ? lineId : DEFAULT_MONSTER_LINE_ID;
}

export function getMonsterLine(lineId: string = DEFAULT_MONSTER_LINE_ID): MonsterLine | undefined {
  return MONSTER_LINE_BY_ID.get(normalizeMonsterLineId(lineId));
}

export function getAvailableMonsterLines(): MonsterLine[] {
  return MONSTER_LINES;
}

interface CreateMonsterInstanceParams {
  id?: string;
  lineId?: string;
  totalXP?: number;
  acquiredAt?: string | null;
  heldItemType?: string | null;
  heldItemName?: string | null;
  forcedSpeciesId?: number | null;
}

export function createMonsterInstance({
  id,
  lineId = DEFAULT_MONSTER_LINE_ID,
  totalXP = 0,
  acquiredAt = null,
  heldItemType = null,
  heldItemName = null,
  forcedSpeciesId = null,
}: CreateMonsterInstanceParams = {}): MonsterInstance {
  const safeLineId = normalizeMonsterLineId(lineId);
  return {
    id: id ?? `${safeLineId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    lineId: safeLineId,
    totalXP: clampMonsterXP(totalXP),
    ...(acquiredAt ? { acquiredAt } : {}),
    heldItemType: typeof heldItemType === "string" && heldItemType ? heldItemType : undefined,
    heldItemName: typeof heldItemName === "string" && heldItemName ? heldItemName : undefined,
    ...(forcedSpeciesId !== null ? { forcedSpeciesId } : {}),
  } as any;
}

export function normalizeMonsterCollection(collection: any, legacy: { lineId?: string | null; totalXP?: number } = {}): MonsterCollection {
  const legacyLineId = normalizeMonsterLineId(legacy.lineId);
  const legacyXP = clampMonsterXP(legacy.totalXP);
  const sourceMonsters = Array.isArray(collection?.monsters)
    ? collection.monsters
    : (DEFAULT_MONSTER_COLLECTION.monsters || []).map(monster => ({
        ...monster,
        totalXP: monster.lineId === legacyLineId ? legacyXP : 0,
      }));

  const byId = new Map<string, MonsterInstance>();
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
  const partyIds: (string | null)[] = [];
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

  const seenPartyIds = new Set<string>();
  for (let i = 0; i < partyIds.length; i += 1) {
    const id = partyIds[i];
    if (!id) continue;
    if (seenPartyIds.has(id)) partyIds[i] = null;
    else seenPartyIds.add(id);
  }

  const habitatVisits: Record<string, number> = {};
  if (collection?.habitatVisits && typeof collection.habitatVisits === "object") {
    for (const [habitatId, visits] of Object.entries(collection.habitatVisits)) {
      const safeVisits = Number(visits);
      if (Number.isFinite(safeVisits) && safeVisits > 0) {
        habitatVisits[habitatId] = Math.floor(safeVisits);
      }
    }
  }

  const professorTransfers: Record<string, number> = {};
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
  const giftClaims: Record<string, boolean> = {};
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

export function getActiveMonster(collection: any): MonsterInstance {
  const normalized = normalizeMonsterCollection(collection);
  return (
    normalized.monsters.find(monster => monster.id === normalized.activeId) ??
    normalized.monsters[0]
  );
}

export function getMonsterById(collection: any, monsterId: string): MonsterInstance | null {
  const normalized = normalizeMonsterCollection(collection);
  return normalized.monsters.find(monster => monster.id === monsterId) ?? null;
}

export function setActiveMonster(collection: any, monsterId: string): MonsterCollection {
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

export function getPartySlots(collection: any): (MonsterInstance | null)[] {
  const normalized = normalizeMonsterCollection(collection);
  const byId = new Map(normalized.monsters.map(monster => [monster.id, monster]));
  return Array.from({ length: PARTY_SIZE }, (_, index) => {
    const id = normalized.partyIds[index];
    return id ? byId.get(id) ?? null : null;
  });
}

export function getPartyCount(collection: any): number {
  return getPartySlots(collection).filter(Boolean).length;
}

export function updatePartyXP(collection: any, gainedXP: number): MonsterCollection {
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
        !(monster as any).forcedSpeciesId
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
            } as any;
          }
        }
      }

      return nextMonster;
    }),
  };
}

export function getBoxMonsters(collection: any): MonsterInstance[] {
  const normalized = normalizeMonsterCollection(collection);
  const partyIdSet = new Set(normalized.partyIds);
  return normalized.monsters.filter(monster => !partyIdSet.has(monster.id));
}

export function sortBoxMonsters(collection: any, mode: "dex" | "level"): MonsterCollection {
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
      partyIdSet.has(monster.id) ? monster : boxQueue.shift()!,
    ),
  });
}

export function getBoxCount(collection: any): number {
  return getBoxMonsters(collection).length;
}

export function sendPartySlotToBox(collection: any, partyIndex: number): MonsterCollection {
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

export function swapMonsterLocations(collection: any, first: any, second: any): MonsterCollection {
  const normalized = normalizeMonsterCollection(collection);
  if (!first || !second) return normalized;

  const partyIds = normalized.partyIds.slice(0, PARTY_SIZE);
  const monsters = [...normalized.monsters];
  const partyIdSet = new Set(partyIds);

  const getLocationId = (location: any) => {
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

export function updateMonsterXP(collection: any, monsterId: string, getNextXP: (xp: number) => number): MonsterCollection {
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

export function sendMonstersToProfessor(collection: any, monsterIds: string[] = []): MonsterCollection {
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

export function getTotalProfessorTransfers(collection: any): number {
  const normalized = normalizeMonsterCollection(collection);
  return Object.values(normalized.professorTransfers ?? {}).reduce(
    (sum, count) => sum + Math.max(0, Number(count) || 0),
    0,
  );
}

export function getPendingFossilGift(collection: any, { unlockedPoolSize = 0, habitatMinPools = {} } = {}): FossilGiftGroup | null {
  const normalized = normalizeMonsterCollection(collection);
  const poolSize = Math.max(0, Number(unlockedPoolSize) || 0);
  if (poolSize < resolveGiftMinPool(FOSSIL_GIFT_GROUP, habitatMinPools)) return null;
  if (isFossilGiftClaimed(normalized.giftClaims)) return null;
  return FOSSIL_GIFT_GROUP;
}

export function claimFossilGift(collection: any, lineId: string, { habitatMinPools = {} } = {}): { collection: MonsterCollection; awarded: any | null } {
  const normalized = normalizeMonsterCollection(collection);
  const choice = FOSSIL_GIFT_GROUP.choices.find(entry => entry.lineId === lineId);
  if (!choice) return { collection: normalized, awarded: null };
  if (isFossilGiftClaimed(normalized.giftClaims)) return { collection: normalized, awarded: null };

  const giftId = `${FOSSIL_GIFT_GROUP.id}-${choice.lineId}`;
  const level = Math.max(1, Number(FOSSIL_GIFT_GROUP.level) || 1);
  const line = getMonsterLine(choice.lineId);
  if (!line) return { collection: normalized, awarded: null };

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
  collection: any,
  { unlockedPoolSize = 0, trigger = "all", habitatMinPools = {} } = {},
): { collection: MonsterCollection; awarded: any[] } {
  const normalized = normalizeMonsterCollection(collection);
  const totalTransfers = getTotalProfessorTransfers(normalized);
  const poolSize = Math.max(0, Number(unlockedPoolSize) || 0);
  const nextGiftClaims = { ...normalized.giftClaims };
  const awarded: any[] = [];
  const monsters = [...normalized.monsters];

  for (const event of GIFT_MONSTER_EVENTS) {
    if (trigger !== "all" && event.trigger !== trigger) continue;
    if (nextGiftClaims[event.id]) continue;
    if (event.trigger === "professor-transfer" && totalTransfers < (event.requiredTransfers ?? 0)) continue;
    if (event.trigger === "pool" && poolSize < resolveGiftMinPool(event, habitatMinPools)) continue;

    const line = getMonsterLine(event.lineId);
    if (!line) continue;
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

export function getGiftToastTitle(gift: any): string {
  if (gift?.trigger === "professor-transfer") return "博士からもらった！";
  return "ポケモンをもらった！";
}

export function totalXPForLevel(level: number): number {
  const cappedLevel = clampLevel(level);
  if (cappedLevel <= 1) return 0;
  return XP_FACTOR * ((cappedLevel - 1) * cappedLevel) / 2;
}

export function xpToNextLevel(level: number): number {
  const cappedLevel = clampLevel(level);
  if (cappedLevel >= MAX_MONSTER_LEVEL) return 0;
  return XP_FACTOR * cappedLevel;
}

export function levelFromTotalXP(xp: number): number {
  const cappedXP = clampMonsterXP(xp);
  const n = Math.floor((1 + Math.sqrt(1 + (8 * cappedXP) / XP_FACTOR)) / 2);
  return clampLevel(n);
}

/** レベルから現在の種族を取得 */
export function getSpecies(level: number, lineId: string = DEFAULT_MONSTER_LINE_ID): Species {
  const line = getMonsterLine(lineId);
  if (!line) throw new Error(`Monster line ${lineId} not found`);
  return (
    [...line.species].reverse().find(s => level >= s.minLevel) ??
    line.species[0]
  );
}

interface MonsterState {
  level: number;
  currentXP: number;
  neededXP: number;
  pct: number;
  species: Species;
  line: MonsterLine;
}

/**
 * 累計 XP からモンスターの状態を返す
 */
export function getMonsterState(totalXP: number, lineId: string = DEFAULT_MONSTER_LINE_ID): MonsterState {
  const cappedXP = clampMonsterXP(totalXP);
  const level = levelFromTotalXP(cappedXP);
  const levelBase = totalXPForLevel(level);
  const currentXP = level >= MAX_MONSTER_LEVEL ? 0 : cappedXP - levelBase;
  const neededXP = xpToNextLevel(level);
  const line = getMonsterLine(lineId);
  if (!line) throw new Error(`Monster line ${lineId} not found`);
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

const ITEM_EVOLUTION_ITEM_TYPES: Record<string, string> = {
  cable: "つうしんケーブル",
  fire: "ほのおのいし",
  water: "みずのいし",
  leaf: "リーフのいし",
  thunder: "かみなりのいし",
  moon: "つきのいし",
};

const ITEM_TYPE_WEIGHTS: Record<string, number> = {
  cable: 6,
  fire: 20,
  leaf: 20,
  water: 20,
  thunder: 20,
  moon: 14,
};

const TRADE_ITEM_EVOLUTIONS: Record<number, number> = {
  64: 65, // ユンゲラー -> フーディン
  93: 94, // ゴースト -> ゲンガー
  67: 68, // ゴーリキー -> カイリキー
  75: 76, // ゴローン -> ゴローニャ
};

const ITEM_EVO_SPECIES_TARGETS: Record<number, Record<string, number>> = {
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

const SPECIES_BY_ID = new Map<number, Species>(MONSTER_LINES.flatMap(line => line.species).map(s => [s.id, s]));

export function getSpeciesById(speciesId: number | string): Species | null {
  return SPECIES_BY_ID.get(Number(speciesId)) ?? null;
}

export function getMonsterDisplayState(monster: any): MonsterState {
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

export function getItemEvolutionTypesForSpecies(speciesId: number | string): string[] {
  const parsedId = Number(speciesId);
  if (Object.prototype.hasOwnProperty.call(TRADE_ITEM_EVOLUTIONS, parsedId)) {
    return ["cable"];
  }
  if (Object.prototype.hasOwnProperty.call(ITEM_EVO_SPECIES_TARGETS, parsedId)) {
    return Object.keys(ITEM_EVO_SPECIES_TARGETS[parsedId]);
  }
  return [];
}

export function getItemEvolutionName(itemType: string): string | null {
  return ITEM_EVOLUTION_ITEM_TYPES[itemType] ?? null;
}

export function getItemEvolutionTargetSpeciesId(speciesId: number | string, itemType: string): number | null {
  const parsedId = Number(speciesId);
  if (Object.prototype.hasOwnProperty.call(TRADE_ITEM_EVOLUTIONS, parsedId) && itemType === "cable") {
    return TRADE_ITEM_EVOLUTIONS[parsedId];
  }
  const targets = ITEM_EVO_SPECIES_TARGETS[parsedId];
  return targets ? targets[itemType] ?? null : null;
}

export function getItemEvolutionCandidates(collection: any, partyOnly: boolean = true): { monster: MonsterInstance; itemTypes: string[] }[] {
  const normalized = normalizeMonsterCollection(collection);
  const candidates: { monster: MonsterInstance; itemTypes: string[] }[] = [];
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

export interface ItemEvolutionPickup {
  monsterId: string;
  itemType: string;
  itemName: string;
}

export function getItemEvolutionPickup(collection: any, rng: () => number = Math.random): ItemEvolutionPickup | null {
  const candidates = getItemEvolutionCandidates(collection, true);
  if (candidates.length === 0) return null;

  const buckets = new Map<string, MonsterInstance[]>();
  for (const { monster, itemTypes } of candidates) {
    for (const itemType of itemTypes) {
      const current = buckets.get(itemType) ?? [];
      current.push(monster);
      buckets.set(itemType, current);
    }
  }

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

export function getItemEvolutionCandidateTypes(collection: any): string[] {
  return getItemEvolutionCandidates(collection, true)
    .flatMap(candidate => candidate.itemTypes)
    .filter((value, index, self) => self.indexOf(value) === index);
}

export function getXpForLevel(level: number): number {
  return totalXPForLevel(level);
}

export interface StatBonus {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

/**
 * レベルに応じたステータスボーナスを計算
 */
export function getMonsterStatBonus(level: number): StatBonus {
  const clampedLevel = clampLevel(level);
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

export interface LevelUpGrowthItem {
  statName: string;
  bonus: number;
}

/**
 * レベルアップ時の成長率を返す
 */
export function getLevelUpGrowth(fromLevel: number, toLevel: number): LevelUpGrowthItem[] {
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
