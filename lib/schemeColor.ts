/**
 * ライト/ダークで別の色を持つデータ色（Tier）を、
 * インライン style に渡せる1つの CSS 値にまとめる。
 * :root の color-scheme（light dark）に従ってブラウザが選ぶので、
 * OS の設定が切り替わっても再描画なしで追従する。
 */
export function schemeColor({ color, lightColor }: { color: string; lightColor: string }): string {
  return `light-dark(${lightColor}, ${color})`;
}
