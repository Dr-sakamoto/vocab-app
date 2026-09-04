import { QuizGameProvider } from "../contexts/QuizGameContext";

/**
 * 単語クイズの画面（`/`・`/result`・`/progress`）を包むレイアウト。
 *
 * クイズの状態はこの Provider に置く。`/` と `/result` の間を遷移しても
 * 採点中の裏処理やクラウド同期が途切れないようにするためで、ここが
 * 「レイアウト直下」であることに意味がある（CLAUDE.md）。
 *
 * ルートレイアウトではなくルートグループに置いているのは、クイズの状態を
 * 必要としない画面（`/legal`・`/privacy`・`/terms`）を Provider の下に
 * 入れないため。入ってしまうと、規約ページを開いただけで単語の出題プール
 * （数万語ぶんのデータ）とクラウド同期が走る。
 *
 * そのため、`useQuizGame` を使うページは必ずこのグループの下に置くこと
 * （`app/(quiz)/progress/` のように）。外に置くと Provider が無く、
 * ビルドの事前描画が "useQuizGame must be used within QuizGameProvider"
 * で落ちる。tests/appStructure.test.mjs がこの配置を見張っている。
 */
export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <QuizGameProvider>{children}</QuizGameProvider>;
}
