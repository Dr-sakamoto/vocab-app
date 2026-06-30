// capture.js の先頭のインポートに getXpForLevel を追加
import { createMonsterInstance, normalizeMonsterCollection, getXpForLevel, getMonsterLine, getSpecies, getLineIdBySpeciesId, getItemEvolutionPickup } from "./monster.js";

export function applyCaptureResultToCollection(collection, result) {
  const normalized = normalizeMonsterCollection(collection);
  if (result?.itemPickup) {
    const { monsterId, itemType, itemName } = result.itemPickup;
    return normalizeMonsterCollection({
      ...normalized,
      monsters: normalized.monsters.map(monster => {
        if (monster.id !== monsterId) return monster;
        return {
          ...monster,
          heldItemType: itemType,
          heldItemName: itemName,
        };
      }),
    });
  }
  if (!result?.caught || !result.lineId || !result.monsterId) return normalized;

  const habitatVisits = {
    ...normalized.habitatVisits,
    [result.habitat.id]: (normalized.habitatVisits[result.habitat.id] ?? 0) + 1,
  };

  // 決定したレベルから初期XPを逆算
  const initialXP = typeof getXpForLevel === "function" 
    ? getXpForLevel(result.level, result.lineId) 
    : 0;

  const monsters = [
    ...normalized.monsters,
    createMonsterInstance({
      id: result.monsterId,
      lineId: result.lineId,
      level: result.level,
      totalXP: initialXP, // ← 算出した初期XPをセット！
      acquiredAt: result.habitat.id,
    }),
  ];

  // Normalize but ensure newly-caught monsters are boxed (not auto-added to party)
  const next = normalizeMonsterCollection({ ...normalized, habitatVisits, monsters });
  const cleanedPartyIds = next.partyIds.map(id => (id === result.monsterId ? null : id));
  const cleanedActiveId = next.activeId === result.monsterId ? (cleanedPartyIds.find(Boolean) ?? null) : next.activeId;

  return { ...next, partyIds: cleanedPartyIds, activeId: cleanedActiveId };
}

export const CAPTURE_RATES_BY_GRADE = {
  D: 0.1,
  C: 0.3,
  B: 0.5,
  A: 0.7,
  S: 1,
};

const ITEM_PICKUP_PROBABILITY = 0.3;
const LATEST_HABITAT_PROBABILITY = 0.4;

const both = encounters => ({ fireRed: encounters, leafGreen: encounters });
const split = (fireRed, leafGreen) => ({ fireRed, leafGreen });

// Normal grass/cave/building encounters only. Fishing, surfing, fixed events,
// trades, roaming legendaries, and gift Pokemon are intentionally omitted.
export const HABITATS = [
  {
    id: "route-1",
    name: "1ばんどうろ",
    minPool: 60,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 16, minLevel: 2, maxLevel: 5,  rate: 50 }, // ポッポ
      { speciesId: 19, minLevel: 2, maxLevel: 4,  rate: 50 }, // コラッタ
    ]),
  },
  {
    id: "route-22",
    name: "22ばんどうろ",
    minPool: 90,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 19, minLevel: 2, maxLevel: 5,  rate: 45 }, // コラッタ
      { speciesId: 56, minLevel: 2, maxLevel: 5,  rate: 45 }, // マンキー
      { speciesId: 21, minLevel: 3, maxLevel: 5,  rate: 10 }, // オニスズメ
    ]),
  },
  {
    id: "route-2",
    name: "2ばんどうろ",
    minPool: 120,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 16, minLevel: 2, maxLevel: 5,  rate: 45 }, // ポッポ
      { speciesId: 19, minLevel: 2, maxLevel: 5,  rate: 45 }, // コラッタ
      { speciesId: 10, minLevel: 4, maxLevel: 5,  rate:  5 }, // キャタピー
      { speciesId: 13, minLevel: 4, maxLevel: 5,  rate:  5 }, // ビードル
    ]),
  },
  {
    id: "viridian-forest",
    name: "トキワのもり",
    minPool: 150,
    encounterRule: "frlg-version-average",
    versionEncounters: both(
      [
        { speciesId: 10, minLevel: 3, maxLevel: 5,  rate: 40 }, // キャタピー 
        { speciesId: 10, minLevel: 4, maxLevel: 6,  rate: 7.5 }, // トランセル 
        { speciesId: 13, minLevel: 3, maxLevel: 5,  rate: 40 }, // ビードル 
        { speciesId: 13, minLevel: 4, maxLevel: 6,  rate:  7.5 }, // コクーン 
        { speciesId: 25, minLevel: 3, maxLevel: 5,  rate:  5 }, // ピカチュウ
      ],
    ),
  },
  {
    id: "route-3",
    name: "3ばんどうろ",
    minPool: 180,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 21, minLevel: 6, maxLevel: 8,  rate: 35 }, // オニスズメ
      { speciesId: 16, minLevel: 6, maxLevel: 7,  rate: 30 }, // ポッポ
      { speciesId: 39, minLevel: 3, maxLevel: 7,  rate: 10 }, // プリン
      { speciesId: 56, minLevel: 7, maxLevel: 7,  rate: 10 }, // マンキー
      { speciesId: 29, minLevel: 6, maxLevel: 7,  rate: 10 }, // ニドラン♀
      { speciesId: 32, minLevel: 6, maxLevel: 7,  rate:  5 }, // ニドラン♂
    ]),
  },
  {
    id: "mt-moon",
    name: "おつきみやま",
    minPool: 240,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 41, minLevel:  7, maxLevel: 11, rate: 49 }, // ズバット
      { speciesId: 74, minLevel:  7, maxLevel: 10, rate: 30 }, // イシツブテ
      { speciesId: 46, minLevel:  5, maxLevel: 12, rate: 15 }, // パラス
      { speciesId: 35, minLevel:  8, maxLevel: 12, rate:  6 }, // ピッピ
    ]),
  },
  {
    id: "route-4",
    name: "4ばんどうろ",
    minPool: 300,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 19, minLevel:  8, maxLevel: 12, rate: 35 }, // コラッタ
      { speciesId: 21, minLevel:  8, maxLevel: 12, rate: 35 }, // オニスズメ
      { speciesId: 23, minLevel:  6, maxLevel: 12, rate: 15 }, // アーボ
      { speciesId: 27, minLevel:  6, maxLevel: 12, rate: 15 }, // サンド
    ]),
  },
  {
    id: "route-24",
    name: "24ばんどうろ",
    minPool: 360,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 43, minLevel: 12, maxLevel: 14, rate: 25 }, // ナゾノクサ (FR)
        { speciesId: 10, minLevel:  7, maxLevel:  7, rate: 21 }, // キャタピー
        { speciesId: 13, minLevel:  7, maxLevel:  7, rate: 24 }, // ビードル
        { speciesId: 16, minLevel: 11, maxLevel: 13, rate: 15 }, // ポッポ
        { speciesId: 63, minLevel:  8, maxLevel: 12, rate: 15 }, // ケーシィ
      ],
      [
        { speciesId: 69, minLevel: 12, maxLevel: 14, rate: 25 }, // マダツボミ (LG)
        { speciesId: 10, minLevel:  7, maxLevel:  7, rate: 24 }, // キャタピー
        { speciesId: 13, minLevel:  7, maxLevel:  7, rate: 21 }, // ビードル
        { speciesId: 16, minLevel: 11, maxLevel: 13, rate: 15 }, // ポッポ
        { speciesId: 63, minLevel:  8, maxLevel: 12, rate: 15 }, // ケーシィ
      ],
    ),
  },
  {
    id: "route-25",
    name: "25ばんどうろ",
    minPool: 420,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 43, minLevel: 12, maxLevel: 14, rate: 25 }, // ナゾノクサ (FR)
        { speciesId: 10, minLevel:  8, maxLevel:  8, rate: 21 }, // キャタピー
        { speciesId: 13, minLevel:  8, maxLevel:  8, rate: 24 }, // ビードル
        { speciesId: 16, minLevel: 11, maxLevel: 13, rate: 15 }, // ポッポ
        { speciesId: 63, minLevel:  9, maxLevel: 13, rate: 15 }, // ケーシィ
      ],
      [
        { speciesId: 69, minLevel: 12, maxLevel: 14, rate: 25 }, // マダツボミ (LG)
        { speciesId: 10, minLevel:  8, maxLevel:  8, rate: 24 }, // キャタピー
        { speciesId: 13, minLevel:  8, maxLevel:  8, rate: 21 }, // ビードル
        { speciesId: 16, minLevel: 11, maxLevel: 13, rate: 15 }, // ポッポ
        { speciesId: 63, minLevel:  9, maxLevel: 13, rate: 15 }, // ケーシィ
      ],
    ),
  },
  {
    id: "route-5",
    name: "5ばんどうろ",
    minPool: 480,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 16, minLevel: 13, maxLevel: 16, rate: 40 }, // ポッポ
        { speciesId: 52, minLevel: 10, maxLevel: 16, rate: 25 }, // ニャース
        { speciesId: 43, minLevel: 13, maxLevel: 16, rate: 25 }, // ナゾノクサ (FR)
        { speciesId: 56, minLevel: 13, maxLevel: 16, rate: 10 }, // マンキー
      ],
      [
        { speciesId: 16, minLevel: 13, maxLevel: 16, rate: 40 }, // ポッポ
        { speciesId: 52, minLevel: 10, maxLevel: 16, rate: 25 }, // ニャース
        { speciesId: 69, minLevel: 13, maxLevel: 16, rate: 25 }, // マダツボミ (LG)
        { speciesId: 56, minLevel: 13, maxLevel: 16, rate: 10 }, // マンキー
      ],
    ),
  },
  {
    id: "route-6",
    name: "6ばんどうろ",
    minPool: 540,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 16, minLevel: 13, maxLevel: 16, rate: 40 }, // ポッポ
        { speciesId: 52, minLevel: 10, maxLevel: 16, rate: 25 }, // ニャース
        { speciesId: 43, minLevel: 13, maxLevel: 16, rate: 25 }, // ナゾノクサ (FR)
        { speciesId: 56, minLevel: 13, maxLevel: 16, rate: 10 }, // マンキー
      ],
      [
        { speciesId: 16, minLevel: 13, maxLevel: 16, rate: 40 }, // ポッポ
        { speciesId: 52, minLevel: 10, maxLevel: 16, rate: 25 }, // ニャース
        { speciesId: 69, minLevel: 13, maxLevel: 16, rate: 25 }, // マダツボミ (LG)
        { speciesId: 56, minLevel: 13, maxLevel: 16, rate: 10 }, // マンキー
      ],
    ),
  },
  {
    id: "digletts-cave",
    name: "ディグダのあな",
    minPool: 600,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 50, minLevel: 15, maxLevel: 31, rate: 95 }, // ディグダ
      { speciesId: 51, minLevel: 26, maxLevel: 29, rate:  5 }, // ダグトリオ
    ]),
  },
  {
    id: "route-11",
    name: "11ばんどうろ",
    minPool: 660,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 21, minLevel: 13, maxLevel: 17, rate: 35 }, // オニスズメ
      { speciesId: 96, minLevel: 11, maxLevel: 15, rate: 25 }, // スリープ
      { speciesId: 23, minLevel: 12, maxLevel: 15, rate: 20 }, // アーボ
      { speciesId: 27, minLevel: 12, maxLevel: 15, rate: 20 }, // サンド
    ]),
  },
  {
    id: "route-9",
    name: "9ばんどうろ",
    minPool: 720,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 21, minLevel: 13, maxLevel: 17, rate: 35 }, // オニスズメ
        { speciesId: 19, minLevel: 14, maxLevel: 17, rate: 30 }, // コラッタ
        { speciesId: 23, minLevel: 11, maxLevel: 17, rate: 25 }, // アーボ (FR)
        { speciesId: 27, minLevel: 11, maxLevel: 17, rate: 10 }, // サンド (FR)
      ],
      [
        { speciesId: 21, minLevel: 13, maxLevel: 17, rate: 35 }, // オニスズメ
        { speciesId: 19, minLevel: 14, maxLevel: 17, rate: 30 }, // コラッタ
        { speciesId: 27, minLevel: 11, maxLevel: 17, rate: 25 }, // サンド (LG)
        { speciesId: 23, minLevel: 11, maxLevel: 17, rate: 10 }, // アーボ (LG)
      ],
    ),
  },
  {
    id: "rock-tunnel",
    name: "イワヤマトンネル",
    minPool: 780,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 41, minLevel: 15, maxLevel: 16, rate: 35 }, // ズバット
      { speciesId: 74, minLevel: 15, maxLevel: 17, rate: 35 }, // イシツブテ
      { speciesId: 66, minLevel: 16, maxLevel: 17, rate: 15 }, // ワンリキー
      { speciesId: 95, minLevel: 13, maxLevel: 17, rate: 10 }, // イワーク
      { speciesId: 56, minLevel: 16, maxLevel: 17, rate:  5 }, // マンキー
    ]),
  },
  {
    id: "route-7",
    name: "7ばんどうろ",
    minPool: 840,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 16, minLevel: 19, maxLevel: 22, rate: 30 }, // ポッポ
        { speciesId: 43, minLevel: 19, maxLevel: 22, rate: 30 }, // ナゾノクサ (FR)
        { speciesId: 52, minLevel: 17, maxLevel: 20, rate: 20 }, // ニャース
        { speciesId: 58, minLevel: 18, maxLevel: 20, rate: 20 }, // ガーディ (FR)
      ],
      [
        { speciesId: 16, minLevel: 19, maxLevel: 22, rate: 30 }, // ポッポ
        { speciesId: 69, minLevel: 19, maxLevel: 22, rate: 30 }, // マダツボミ (LG)
        { speciesId: 52, minLevel: 17, maxLevel: 20, rate: 20 }, // ニャース
        { speciesId: 37, minLevel: 18, maxLevel: 20, rate: 20 }, // ロコン (LG)
      ],
    ),
  },
  {
    id: "route-8",
    name: "8ばんどうろ",
    minPool: 900,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 16, minLevel: 18, maxLevel: 20, rate: 30 }, // ポッポ
        { speciesId: 52, minLevel: 18, maxLevel: 20, rate: 30 }, // ニャース
        { speciesId: 58, minLevel: 15, maxLevel: 18, rate: 20 }, // ガーディ (FR)
        { speciesId: 23, minLevel: 17, maxLevel: 19, rate: 20 }, // アーボ
      ],
      [
        { speciesId: 16, minLevel: 18, maxLevel: 20, rate: 30 }, // ポッポ
        { speciesId: 52, minLevel: 18, maxLevel: 20, rate: 30 }, // ニャース
        { speciesId: 37, minLevel: 15, maxLevel: 18, rate: 20 }, // ロコン (LG)
        { speciesId: 27, minLevel: 17, maxLevel: 19, rate: 20 }, // サンド
      ],
    ),
  },
  {
    id: "pokemon-tower",
    name: "ポケモンタワー",
    minPool: 960,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 92, minLevel: 13, maxLevel: 19, rate: 75 }, // ゴース
      { speciesId: 93, minLevel: 13, maxLevel: 19, rate: 15 }, // ゴースト
      { speciesId: 104, minLevel: 15, maxLevel: 19, rate: 10 }, // カラカラ
    ]),
  },
  {
    id: "route-10",
    name: "10ばんどうろ",
    minPool: 1020,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 100, minLevel: 14, maxLevel: 17, rate: 40 }, // ビリリダマ
        { speciesId: 21,  minLevel: 13, maxLevel: 17, rate: 35 }, // オニスズメ
        { speciesId: 23,  minLevel: 11, maxLevel: 17, rate: 25 }, // アーボ (FR)
      ],
      [
        { speciesId: 100, minLevel: 14, maxLevel: 17, rate: 40 }, // ビリリダマ
        { speciesId: 21,  minLevel: 13, maxLevel: 17, rate: 35 }, // オニスズメ
        { speciesId: 27,  minLevel: 11, maxLevel: 17, rate: 25 }, // サンド (LG)
      ],
    ),
  },
  {
    id: "power-plant",
    name: "むじんはつでんしょ",
    minPool: 1080,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 81,  minLevel: 22, maxLevel: 25, rate: 30}, // コイル
      { speciesId: 82,  minLevel: 31, maxLevel: 34, rate: 10 }, // レアコイル
      { speciesId: 100, minLevel: 22, maxLevel: 25, rate: 35 }, // ビリリダマ
      { speciesId: 25,  minLevel: 22, maxLevel: 26, rate: 20 }, // ピカチュウ
      { speciesId: 125, minLevel: 32, maxLevel: 35, rate:  5 }, // エレブー
    ]),
  },
  {
    id: "routes-12-15",
    name: "12ばんどうろ - 15ばんどうろ",
    minPool: 1140,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 43, minLevel: 22, maxLevel: 26, rate: 35 }, // ナゾノクサ (FR)
        { speciesId: 48, minLevel: 24, maxLevel: 26, rate: 30 }, // コンパン
        { speciesId: 16, minLevel: 23, maxLevel: 29, rate: 20 }, // ポッポ
        { speciesId: 16, minLevel: 29, maxLevel: 29, rate: 5 }, // ピジョン
        { speciesId: 44, minLevel: 22, maxLevel: 26, rate: 5 }, // クサイハナ (FR)
        { speciesId: 132, minLevel: 25, maxLevel: 25, rate: 5 }, //  メタモン
      ],
      [
        { speciesId: 69, minLevel: 22, maxLevel: 30, rate: 35 }, // マダツボミ (LG)
        { speciesId: 48, minLevel: 24, maxLevel: 26, rate: 30 }, // コンパン
        { speciesId: 16, minLevel: 23, maxLevel: 29, rate: 20 }, // ポッポ
        { speciesId: 16, minLevel: 29, maxLevel: 29, rate: 5 }, // ピジョン
        { speciesId: 70, minLevel: 22, maxLevel: 26, rate: 5 }, // ウツドン (LG)
        { speciesId: 132, minLevel: 25, maxLevel: 25, rate: 5 }, //  メタモン
      ],
    ),
  },
  {
    id: "routes-16-18",
    name: "16ばんどうろ - 18ばんどうろ",
    minPool: 1200,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 21, minLevel: 20, maxLevel: 22, rate: 30 }, // オニスズメ
      { speciesId: 22, minLevel: 25, maxLevel: 29, rate: 15 }, // オニドリル
      { speciesId: 84, minLevel: 24, maxLevel: 28, rate: 35 }, // ドードー
      { speciesId: 19, minLevel: 22, maxLevel: 22, rate: 5 }, // コラッタ
      { speciesId: 20, minLevel: 25, maxLevel: 29, rate: 15 }, // ラッタ
    ]),
  },
  {
    id: "safari-zone",
    name: "サファリゾーン",
    minPool: 1320,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 32,  minLevel: 22, maxLevel: 30, rate: 20 }, // ニドラン♂ (FR)
        { speciesId: 46,  minLevel: 22, maxLevel: 30, rate: 15 }, // パラス
        { speciesId: 111, minLevel: 25, maxLevel: 26, rate: 20 }, // サイホーン
        { speciesId: 102, minLevel: 23, maxLevel: 27, rate: 20 }, // タマタマ
        { speciesId: 84,  minLevel: 26, maxLevel: 26, rate:  5 }, // ドードー
        { speciesId: 113, minLevel: 23, maxLevel: 26, rate:  5 }, // ラッキー
        { speciesId: 115, minLevel: 25, maxLevel: 28, rate:  5 }, // ガルーラ
        { speciesId: 128, minLevel: 25, maxLevel: 28, rate:  5 }, // ケンタロス
        { speciesId: 123, minLevel: 23, maxLevel: 27, rate:  5 }, // ストライク (FR)
      ],
      [
        { speciesId: 29,  minLevel: 22, maxLevel: 30, rate: 20 }, // ニドラン♀ (LG)
        { speciesId: 46,  minLevel: 22, maxLevel: 30, rate: 15 }, // パラス
        { speciesId: 111, minLevel: 25, maxLevel: 26, rate: 20 }, // サイホーン
        { speciesId: 102, minLevel: 23, maxLevel: 27, rate: 20 }, // タマタマ
        { speciesId: 84,  minLevel: 26, maxLevel: 26, rate:  5 }, // ドードー
        { speciesId: 113, minLevel: 23, maxLevel: 26, rate:  5 }, // ラッキー
        { speciesId: 115, minLevel: 25, maxLevel: 28, rate:  5 }, // ガルーラ
        { speciesId: 128, minLevel: 25, maxLevel: 28, rate:  5 }, // ケンタロス
        { speciesId: 127, minLevel: 23, maxLevel: 27, rate:  5 }, // カイロス (LG)
      ],
    ),
  },
  {
    id: "pokemon-mansion",
    name: "ポケモンやしき",
    minPool: 1500,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { speciesId: 19,  minLevel: 26, maxLevel: 28, rate: 15 }, // コラッタ
        { speciesId: 20,  minLevel: 32, maxLevel: 36, rate: 30 }, // ラッタ
        { speciesId: 109, minLevel: 28, maxLevel: 28, rate: 35 }, // ドガース (FR)
        { speciesId: 110, minLevel: 32, maxLevel: 32, rate: 5 }, // マタドガス (FR)
        { speciesId: 58,  minLevel: 30, maxLevel: 32, rate: 15 }, // ガーディ (FR)
        { speciesId: 126, minLevel: 34, maxLevel: 36, rate: 5 }, // ブーバー
      ],
      [
        { speciesId: 19,  minLevel: 26, maxLevel: 28, rate: 15 }, // コラッタ
        { speciesId: 20,  minLevel: 32, maxLevel: 36, rate: 30 }, // ラッタ
        { speciesId: 88,  minLevel: 28, maxLevel: 30, rate: 35 }, // ベトベター (LG)
        { speciesId: 89,  minLevel: 30, maxLevel: 32, rate: 5 }, // ベトベトン (LG)
        { speciesId: 37,  minLevel: 30, maxLevel: 32, rate: 15 }, // ロコン (LG)
        { speciesId: 126, minLevel: 34, maxLevel: 36, rate: 5 }, // ブーバー
      ],
    ),
  },
  {
    id: "seafoam-islands",
    name: "ふたごじま",
    minPool: 1620,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 41, minLevel: 22, maxLevel: 30, rate: 10 }, // ズバット
      { speciesId: 42, minLevel: 22, maxLevel: 30, rate: 10 }, // ゴルバット
      { speciesId: 54, minLevel: 26, maxLevel: 33, rate: 10 }, // コダック
      { speciesId: 55, minLevel: 26, maxLevel: 33, rate: 7.5 }, // ゴルダック
      { speciesId: 79, minLevel: 26, maxLevel: 33, rate: 10 }, // ヤドン
      { speciesId: 80, minLevel: 26, maxLevel: 33, rate: 7.5 }, // ヤドラン
      { speciesId: 86, minLevel: 30, maxLevel: 32, rate: 40 }, // パウワウ
      { speciesId: 87, minLevel: 32, maxLevel: 34, rate: 15 }, // ジュゴン
    ]),
  },
  {
    id: "victory-road",
    name: "チャンピオンロード",
    minPool: 1800,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 66, minLevel: 32, maxLevel: 32, rate: 20 }, // ワンリキー
      { speciesId: 67, minLevel: 44, maxLevel: 46, rate: 5 }, // ゴーリキー
      { speciesId: 74, minLevel: 32, maxLevel: 32, rate: 15 }, // イシツブテ
      { speciesId: 41, minLevel: 32, maxLevel: 32, rate: 10 }, // ズバット
      { speciesId: 42, minLevel: 44, maxLevel: 44, rate: 5 }, // ゴルバット
      { speciesId: 95, minLevel: 40, maxLevel: 46, rate: 25 }, // イワーク
      { speciesId: 24, minLevel: 44, maxLevel: 44, rate: 5 }, // アーボック
      { speciesId: 28, minLevel: 44, maxLevel: 44, rate: 5 }, // サンドパン
      { speciesId: 105, minLevel: 44, maxLevel: 46, rate: 5 }, // ガラガラ
      { speciesId: 57, minLevel: 42, maxLevel: 42, rate: 5 }, // オコリザル
    ]),
  },
  {
    id: "cerulean-cave",
    name: "ハナダのどうくつ",
    minPool: 2200,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 41,  minLevel: 46, maxLevel: 61, rate: 20 }, // ズバット
      { speciesId: 46,  minLevel: 49, maxLevel: 64, rate: 10 }, // パラス
      { speciesId: 63,  minLevel: 55, maxLevel: 67, rate: 10 }, // ケーシィ
      { speciesId: 66,  minLevel: 46, maxLevel: 52, rate: 10 }, // ワンリキー
      { speciesId: 132, minLevel: 52, maxLevel: 67, rate: 10 }, // メタモン
      { speciesId: 100, minLevel: 58, maxLevel: 64, rate: 10 }, // ビリリダマ
      { speciesId: 104, minLevel: 46, maxLevel: 67, rate: 10 }, // カラカラ
      { speciesId: 111, minLevel: 46, maxLevel: 67, rate: 10 }, // サイホーン
      { speciesId: 113, minLevel: 46, maxLevel: 67, rate: 10 }, // ラッキー
    ]),
  },
  {
    id: "old-rod",
    name: "ボロのつりざお",
    minPool: 660,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 129, minLevel: 5, maxLevel: 5, rate: 100 }, // コイキング
    ]),
  },
  {
    id: "good-rod",
    name: "いいつりざお",
    minPool: 1320,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 129, minLevel: 10, maxLevel: 20, rate: 35 }, // コイキング
      { speciesId: 118, minLevel: 10, maxLevel: 20, rate: 25 }, // トサキント
      { speciesId: 60,  minLevel: 10, maxLevel: 20, rate: 15 }, // ニョロモ
      { speciesId: 72,  minLevel: 15, maxLevel: 25, rate: 10 }, // メノクラゲ
      { speciesId: 116, minLevel: 15, maxLevel: 25, rate:  5 }, // タッツー
      { speciesId: 98,  minLevel: 15, maxLevel: 25, rate:  5 }, // クラブ
      { speciesId: 54,  minLevel: 15, maxLevel: 25, rate:  5 }, // コダック
    ]),
  },
  {
    id: "sea-routes-19-21",
    name: "19 - 21ばんすいどう",
    minPool: 1380,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 72, minLevel: 5,  maxLevel: 40, rate: 95 }, // メノクラゲ
      { speciesId: 73, minLevel: 30, maxLevel: 40, rate:  5 }, // ドククラゲ
    ]),
  },
  {
    id: "super-rod",
    name: "すごいつりざお",
    minPool: 1380,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { speciesId: 130, minLevel: 20, maxLevel: 40, rate: 15 }, // ギャラドス
      { speciesId: 119, minLevel: 33, maxLevel: 45, rate: 15 }, // アズマオウ
      { speciesId: 61,  minLevel: 25, maxLevel: 40, rate: 15 }, // ニョロゾ
      { speciesId: 99,  minLevel: 28, maxLevel: 45, rate: 10 }, // キングラー
      { speciesId: 117, minLevel: 32, maxLevel: 45, rate: 10 }, // シードラ
      { speciesId: 73,  minLevel: 30, maxLevel: 45, rate: 10 }, // ドククラゲ
      { speciesId: 90,  minLevel: 15, maxLevel: 35, rate:  6 }, // シェルダー
      { speciesId: 120, minLevel: 15, maxLevel: 35, rate:  6 }, // ヒトデマン
      { speciesId: 54,  minLevel: 25, maxLevel: 35, rate:  6 }, // コダック
      { speciesId: 79,  minLevel: 25, maxLevel: 35, rate:  6 }, // ヤドン
      { speciesId: 148, minLevel: 30, maxLevel: 40, rate:  1 }, // ハクリュー
    ]),
  },
];


function hashSeed(seed) {
  let h = 2166136261;
  const text = String(seed ?? "capture");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seed) {
  let t = hashSeed(seed);
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function getUnlockedHabitats(unlockedPoolSize, habitats = HABITATS) {
  const poolSize = Number(unlockedPoolSize);
  return habitats.filter(habitat => Number.isFinite(poolSize) && poolSize >= habitat.minPool);
}

/** ギフト解放などで使う、生息地ID → minPool の対応表 */
export function getHabitatMinPoolMap(habitats = HABITATS) {
  return Object.fromEntries(habitats.map(habitat => [habitat.id, habitat.minPool]));
}


export function normalizeVersionedEncounters(versionEncounters) {
  const versions = Object.values(versionEncounters ?? {}).filter(Array.isArray);
  if (versions.length === 0) return [];

  const merged = new Map();
  for (const encounters of versions) {
    for (const encounter of encounters) {
      const rate = Number(encounter.rate);
      if (!Number.isFinite(rate) || rate <= 0) continue;

      const lineId = encounter.lineId ?? getLineIdBySpeciesId(encounter.speciesId);
      if (!lineId) continue;

      const line = getMonsterLine(lineId);
      const defaultMinLevel = line?.species?.[0]?.minLevel ?? 1;
      const defaultMaxLevel = line?.species?.at(-1)?.maxLevel ?? defaultMinLevel;
      const rawMinLevel = Number(encounter.minLevel);
      const rawMaxLevel = Number(encounter.maxLevel);
      const minLevel = Number.isFinite(rawMinLevel) ? rawMinLevel : defaultMinLevel;
      const maxLevel = Number.isFinite(rawMaxLevel) ? rawMaxLevel : minLevel;
      const normalizedMin = Math.min(minLevel, maxLevel);
      const normalizedMax = Math.max(minLevel, maxLevel);
      const key = `${lineId}:${normalizedMin}:${normalizedMax}`;
      const current = merged.get(key);

      if (current) {
        current.weight += rate / versions.length;
      } else {
        merged.set(key, {
          lineId,
          weight: rate / versions.length,
          minLevel: normalizedMin,
          maxLevel: normalizedMax,
        });
      }
    }
  }

  return [...merged.values()];
}

function pickWeighted(items, getWeight, rng) {
  const weighted = items
    .map(item => ({ item, weight: Math.max(0, getWeight(item)) }))
    .filter(entry => entry.weight > 0);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return null;

  let cursor = rng() * total;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.item;
  }
  return weighted.at(-1)?.item ?? null;
}

export function pickHabitat({ unlockedPoolSize, habitatVisits = {}, rng, habitats = HABITATS }) {
  const unlocked = getUnlockedHabitats(unlockedPoolSize, habitats);
  const latest = unlocked.at(-1) ?? null;
  const previousHabitats = latest
    ? unlocked.filter(habitat => habitat.id !== latest.id)
    : [];

  if (!latest) return null;
  if (previousHabitats.length === 0 || rng() < LATEST_HABITAT_PROBABILITY) {
    return latest;
  }

  return pickWeighted(
    previousHabitats,
    habitat => 1 / (1 + Math.max(0, Number(habitatVisits[habitat.id]) || 0)),
    rng,
  );
}

export function pickEncounterLine(habitat, rng) {
  const encounters = normalizeVersionedEncounters(habitat?.versionEncounters);
  return pickWeighted(encounters, encounter => encounter.weight, rng);
}

export function rollCaptureEncounter({
  grade,
  unlockedPoolSize,
  habitatVisits = {},
  seed,
  habitat: selectedHabitat = null,
  habitats = HABITATS,
  monsterCollection = null,
}) {
  const rng = createSeededRng(seed);
  const captureRate = CAPTURE_RATES_BY_GRADE[grade] ?? 0;
  const itemPickup = monsterCollection ? getItemEvolutionPickup(monsterCollection, rng) : null;

  if (itemPickup && rng() < ITEM_PICKUP_PROBABILITY) {
    return {
      caught: false,
      captureRate,
      captureRoll: null,
      reason: "item-drop",
      itemPickup,
    };
  }

  const habitat = selectedHabitat ?? pickHabitat({ unlockedPoolSize, habitatVisits, rng, habitats });
  if (!habitat) {
    return {
      caught: false,
      captureRate,
      captureRoll: null,
      reason: "no-habitat",
    };
  }

  const encounter = pickEncounterLine(habitat, rng);
  if (!encounter) {
    return {
      caught: false,
      captureRate,
      captureRoll: null,
      habitat: { id: habitat.id, name: habitat.name },
      reason: "no-encounter",
    };
  }

  const rawMin = Number(encounter.minLevel);
  const rawMax = Number(encounter.maxLevel);
  const minLvl = Number.isFinite(rawMin) ? rawMin : 1;
  const maxLvl = Number.isFinite(rawMax) ? rawMax : minLvl;
  const actualMin = Math.min(minLvl, maxLvl);
  const actualMax = Math.max(minLvl, maxLvl);
  const generatedLevel = actualMin + Math.floor(rng() * (actualMax - actualMin + 1));
  const captureRoll = rng();
  const caught = captureRoll < captureRate;

  return {
    caught,
    captureRate,
    captureRoll,
    habitat: { id: habitat.id, name: habitat.name },
    lineId: encounter.lineId,
    encounterWeight: encounter.weight,
    level: generatedLevel,
    speciesId: getSpecies(generatedLevel, encounter.lineId).id,
    monsterId: `caught-${encounter.lineId}-${Math.floor(rng() * 1e9).toString(36)}`,
    reason: caught ? undefined : "missed",
  };

}
