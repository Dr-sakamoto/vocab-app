import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "瞬間英作文 ― AI採点で弱点から出題",
  description:
    "日本語を見て英文を書き、AIが添削・採点する瞬間英作文アプリ。文法・表現ごとの習熟度を測り、苦手なところから優先して出題します。",
};

/**
 * 英作文（`/compose` 以下）のレイアウト。
 *
 * 単語クイズ（`/`・`/result`）とは状態も出題データも共有しない別のアプリなので、
 * ルートグループを分けて Provider を跨がせない（app/(quiz)/layout.tsx を参照）。
 * 学習の状態は端末（localStorage）に持ち、画面をまたぐたびに読み直す。
 * セッション中は1つの画面から出ないため、状態を Provider に上げる必要がない。
 */
export default function ComposeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
