/**
 * エティモン（キャラクター）用スプライト差し替えの正本データ。
 *
 * `lib/etymonSprites.json` がスプライトツール（sprites-cowork-editer）と
 * 共有する唯一の正本。ツール側で「決定✔」にしたキャラスプライトを
 * 「vocab-appに反映」すると、PNGが `public/etymon/` にコミットされ、この
 * JSONにパスが追記される。アプリはここを直接読み、該当する系統・段階の
 * スプライトだけを差し替える（habitatSprites と同じ1ステップ反映）。
 *
 * キーは `"<lineId>:<段階インデックス>"`（例: `"bulbasaur:0"` = フシギダネ系統の
 * 基本形）。値は `public/` からの絶対パス（例: `/etymon/bulbasaur-0.png`）。
 * 未登録の系統・段階は従来どおり元のスプライトのまま表示される。
 */
import etymonSpriteData from "./etymonSprites.json";

const SPRITES: Record<string, string> = (etymonSpriteData.sprites ?? {}) as Record<
  string,
  string
>;

/**
 * 系統IDと段階インデックスに対応する差し替えスプライトのパスを返す。
 * 未登録なら null（呼び出し側は元のスプライトを使う）。
 */
export function getEtymonSpriteOverride(
  lineId: string,
  stageIndex: number
): string | null {
  return SPRITES[`${lineId}:${stageIndex}`] ?? null;
}
