// =====================================================
// ブランド / アセット参照の一元管理（独自IP移行の土台）
// -----------------------------------------------------
// 現状、IP依存の文字列・アセットURLがコード各所に散在している。
// 独自IPへ差し替える際、編集対象が一箇所に集まっているほど
// 安全に進められる。今後 monster.js / storyBattles.js /
// layout.tsx 等の固有名詞・アセット参照を段階的にここへ寄せる。
//
// 値はすべて差し替え前提のプレースホルダ。最終的なブランド名・
// 用語・アセットの配信元は、独自IP確定後にここだけ変更すれば
// アプリ全体へ反映される状態を目指す。
// =====================================================

/** アプリのブランド名（layout.tsx のタイトル等で使用） */
// 世界観の詳細は IP_CONCEPT.md を参照。
export const BRAND = Object.freeze({
  name: "Etymon", // 言語学の実在語「語の起源＝根語」。-mon で「集める生き物」と万人に伝わる
  nameJa: "エティモン",
  tagline: "単語が、まるい生き物になる。英単語学習RPG",
});

// アセット配信元。現状は外部の第三者IP資産を直リンクしており、
// 商用化前に「自前ホスティングのオリジナル素材」へ必ず置換する。
// migrated:false の項目が残っている限り商用公開してはいけない。
export const ASSET_SOURCES = Object.freeze({
  monsterSprite: {
    migrated: false,
    current: "https://raw.githubusercontent.com/PokeAPI/sprites/master/...", // 第三者IP
    plan: "オリジナルのモンスター画像を /public/monsters/ に自前ホスティング",
  },
  trainerSprite: {
    migrated: false,
    current: "https://play.pokemonshowdown.com/sprites/trainers", // 第三者IP
    plan: "オリジナルの対戦相手画像を自前ホスティング",
  },
  evolveSound: {
    migrated: false,
    current: "/pokemon-evolve.mp3", // 名称・出所ともに要差し替え
    plan: "ライセンスクリアな効果音へ差し替え（ファイル名も中立化）",
  },
});

// IP依存の用語 → Etymon世界の用語への対応表（リネームの正本）。
// コード・UI文言の置換時はこの表を参照して表記を統一する。
// 世界観の根拠は IP_CONCEPT.md を参照。
export const TERM_GLOSSARY = Object.freeze({
  ポケモン: "Etymon（言葉から生まれたまるい生き物）",
  進化: "BLOOM（咲く）",
  マスターボール: "FULL SYNC",
  ボール: "SYNC（同期して仲間にする）",
  図鑑: "DECK / FEED",
  博士: "ナビ（まるいマスコット）",
  御三家: "はじまりの3匹（見る/聞く/言う＝SPEC/AUD/DICT）",
  トレーナー: "なかま",
  ジム: "ZONE",
});

/** まだ第三者IPアセットに依存していないか（公開可否のゲート） */
export function hasUnmigratedAssets() {
  return Object.values(ASSET_SOURCES).some((a) => !a.migrated);
}
