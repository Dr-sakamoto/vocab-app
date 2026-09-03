import type { ComposeDirection, ComposePrompt } from "./types";

/**
 * 1つの問題データを両方向に使うための取り出し口。
 *
 * 英作文（ja-to-en）と和訳（en-to-ja）で、設問と模範解答が入れ替わる
 * だけの関係にある。サーバー・クライアント・画面のどこか一箇所でも
 * 入れ替えを間違えると、設問と同じ文が模範解答として出るという
 * 一番みっともない壊れ方をするので、変換はここに1本化する。
 */
export function getQuestionText(prompt: ComposePrompt, direction: ComposeDirection): string {
  return direction === "ja-to-en" ? prompt.ja : prompt.answers[0] ?? "";
}

/** 採点で参照する模範解答。和訳では和文が模範解答になる */
export function getExpectedAnswers(
  prompt: ComposePrompt,
  direction: ComposeDirection,
): string[] {
  return direction === "ja-to-en" ? prompt.answers : [prompt.ja];
}

/** 入力欄のプレースホルダなどに使う、向きごとの言い回し */
export function getDirectionLabel(direction: ComposeDirection): string {
  return direction === "ja-to-en" ? "英作文" : "和訳";
}
