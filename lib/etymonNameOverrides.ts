/**
 * Etymon独自名の採用データ（正本は ETYMON_NAMES.md の「status: confirmed」行）。
 *
 * lib/monster.ts のMONSTER_LINESはPokémon準拠の元名を保持したまま、
 * ここに登録された行だけが表示名として上書きされる。ETYMON_NAMES.mdで
 * 新たに confirmed になったら、このオブジェクトに1行追記するだけでよい
 * （lib/monster.ts の種族データ自体を触る必要はない）。
 *
 * status が pending / rejected の行、まだ検討していない行は、この
 * オブジェクトに存在しない＝自動的に元のPokémon名のまま保留される。
 */

export interface EtymonNameOverride {
  /** 基本形（1段階目）の表示名 */
  base?: string;
  /** 中間形（ちょうど3段階のラインの2段階目）の表示名 */
  middle?: string;
  /** 最終形（最後の段階）の表示名 */
  final?: string;
}

export const ETYMON_NAME_OVERRIDES: Record<string, EtymonNameOverride> = {
  bulbasaur: { base: "マウス", final: "ビッグマウス" },
  charmander: { base: "ミミ", final: "ジゴクミミ" },
  squirtle: { base: "マナコ", final: "センリガン" },
  pikachu: { base: "ベロロ", final: "ベロベロロ" },
  weedle: { base: "アンヨ", final: "イダテン" },
  pidgey: { base: "ハナスケ", final: "テングバナ" },
  spearow: { base: "ケイ", final: "ゴコウ" },
  sandshrew: { base: "シュシュ", final: "センジュ" },
  clefairy: { base: "ホシノコ", final: "アマノガワ" },
  oddish: { base: "ハル", middle: "ハルサメ", final: "ハルイチバン" },
  seel: { base: "シモ", final: "シモバシラ" },
  rattata: { base: "カゲマル", final: "クロマク" },
  zubat: { base: "ヨバネ", final: "ヨトウガ" },
  ekans: { final: "サカズキ" },
  hitmonlee: { final: "チュパカブラ" },
  onix: { final: "モスマン" },
  farfetchd: { final: "ユニコーン" },
};
