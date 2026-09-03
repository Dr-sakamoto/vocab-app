import { QuizGameProvider } from "../contexts/QuizGameContext";

/**
 * 単語クイズ（`/` と `/result`）だけを包むレイアウト。
 *
 * クイズの状態はこの Provider に置く。`/` と `/result` の間を遷移しても
 * 採点中の裏処理やクラウド同期が途切れないようにするためで、ここが
 * 「レイアウト直下」であることに意味がある（CLAUDE.md）。
 *
 * ルートレイアウトではなくルートグループに置いているのは、英作文
 * （`/compose`）が同じ Provider の下に入らないようにするため。入って
 * しまうと、英作文の画面を開いただけで単語の出題プール（数万語ぶんの
 * データ）とクラウド同期が走る。学習の状態も混ざらない。
 */
export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <QuizGameProvider>{children}</QuizGameProvider>;
}
