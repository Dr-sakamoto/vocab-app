"use client";

import StudyScreen from "./components/game/StudyScreen";
import FlashScreen from "./components/flash/FlashScreen";
import SettingsModal from "./components/SettingsModal";
import { useQuizGame } from "./contexts/QuizGameContext";

/**
 * 出題画面（`/`）。
 *
 * 10問を一枚の小テストとして出し、英単語を見て日本語訳をタイピングで答える。
 * 全問の採点が出そろうと、状態は Provider（QuizGameContext）側で
 * `/result` への画面遷移として結果発表へ送る。
 */
export default function Page() {
  const { phase, mode, vocabIsEmpty, flash, study, settings } = useQuizGame();

  if (vocabIsEmpty) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <div className="prompt-card w-full max-w-xl p-6">
          <h1 className="text-xl text-ink-1">英単語クイズ</h1>
          <p className="mt-3 text-ink-2">問題データがありません。</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {mode === "flash" || mode === "mistakeFlash" ? (
        <FlashScreen {...flash} />
      ) : (
        <StudyScreen phase={phase} {...study} />
      )}

      <SettingsModal {...settings} />
    </>
  );
}
