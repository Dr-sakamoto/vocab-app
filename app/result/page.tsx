"use client";

import StudyScreen from "../components/game/StudyScreen";
import SettingsModal from "../components/SettingsModal";
import { useQuizGame } from "../contexts/QuizGameContext";

/**
 * 結果発表画面（`/result`）。
 *
 * 10問ぶんの答案（正誤つき）と評価を見せる。結果データは Provider
 * （QuizGameContext）にしか無いため、直接アクセスや再読み込みで
 * phase が "result" でない場合は Provider 側が `/` へ戻す。
 */
export default function ResultPage() {
  const { study, settings } = useQuizGame();

  return (
    <>
      <StudyScreen phase="result" {...study} />
      <SettingsModal {...settings} />
    </>
  );
}
