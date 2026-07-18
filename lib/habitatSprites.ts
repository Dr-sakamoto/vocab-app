/**
 * エリア（ハビタット）用スプライトの正本データ。
 *
 * `lib/habitatSprites.json` がスプライトツール（Etymon Tools）と共有する唯一の
 * 正本。ツール側でエリアごとの画像を設定して「vocab-app に反映」すると、この
 * JSON が更新され、アプリはここを直接読んで WorldWindow に反映する
 * （キャラクター名の override と違い、手作業のミラーは不要）。
 *
 * 画像そのものは vocab-app の `public/` 配下に置き、`sprite` にはそのパス
 * （例: `/areas/elmuria.png`）を入れる。未設定（空文字）のエリアはスプライト
 * を持たない扱いになり、WorldWindow では従来どおり画像なしで表示される。
 */
import habitatSpriteData from "./habitatSprites.json";

export interface HabitatSprite {
  /** メインのスプライト画像パス（`public/` からの絶対パス、または URL） */
  sprite: string;
  /** メインが読めなかったときのフォールバック画像パス（任意） */
  fallbackSprite?: string;
}

interface HabitatSpriteEntry extends HabitatSprite {
  id: string;
  name: string;
}

const AREAS: HabitatSpriteEntry[] = (habitatSpriteData.areas ??
  []) as HabitatSpriteEntry[];

const SPRITE_BY_ID: Record<string, HabitatSprite> = Object.fromEntries(
  AREAS.filter((area) => Boolean(area.sprite)).map((area) => [
    area.id,
    { sprite: area.sprite, fallbackSprite: area.fallbackSprite || undefined },
  ])
);

/**
 * エリアIDに対応するスプライトを返す。未設定・未知のIDなら null。
 * 呼び出し側は null のときスプライトを描画しない（後方互換の見た目）。
 */
export function getHabitatSprite(
  habitatId: string | null | undefined
): HabitatSprite | null {
  if (!habitatId) return null;
  return SPRITE_BY_ID[habitatId] ?? null;
}
