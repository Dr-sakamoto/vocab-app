"use client";

import AuroraBackground from "../AuroraBackground";
import EtymonDock from "../EtymonDock";
import InlineResult from "../InlineResult";
import WorldWindow from "../WorldWindow";
import QuestionCard from "./QuestionCard";
import TileAnswerBoard, { TileAnswerBoardProps } from "./TileAnswerBoard";
import {
  DockBlockProps,
  FANTASY_AURORA,
  QuizBlockProps,
  ResultBlockProps,
  WorldBlockProps,
} from "./screenProps";

export interface MobileGameScreenProps {
  world: WorldBlockProps;
  quiz: QuizBlockProps;
  result: ResultBlockProps;
  tiles: TileAnswerBoardProps;
  dock: DockBlockProps;
}

/**
 * スマホ版スクリーン。
 * - 最上段はマップのマス（正方形）を基準にした固定高の帯。問題が画面中央に来る
 * - 回答は文字盤（みんはや式・1文字ずつタップ）固定。キーボードは一切出さない
 *   ので、タイピングやキーボード折りたたみの分岐は持たない
 */
export default function MobileGameScreen({
  world,
  quiz,
  result,
  tiles,
  dock,
}: MobileGameScreenProps) {
  return (
    <div className="quiz-shell fantasy-shell relative h-dvh overflow-hidden">
      <AuroraBackground colors={FANTASY_AURORA} />
      <div className="scene-vignette" aria-hidden />

      <div className="relative z-10 flex h-full w-full flex-col gap-2 p-2">
        {/* ── 1. ワールドウィンドウ（マップのマス=正方形を基準にした高さ） ── */}
        <header className="h-28 shrink-0">
          <WorldWindow {...world} />
        </header>

        {/* ── 2. 問題ウィンドウ（残り全部。問題が画面の真ん中に来る） ── */}
        <main className="min-h-0 flex-1">
          <div className="parchment flex h-full min-h-0 flex-col overflow-hidden rounded-lg">
            {quiz.phase === "result" ? (
              <InlineResult
                evaluation={result.evaluation}
                score={result.score}
                playLimit={result.playLimit}
                unlockedThisRun={result.unlockedThisRun}
                onContinue={result.onContinue}
              />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <div className="my-auto w-full px-3 py-3">
                  {/* プログレス行 */}
                  <div className="flex items-center gap-2">
                    <div
                      className="gauge-track h-1.5 flex-1 overflow-hidden rounded-full"
                      role="progressbar"
                      aria-valuenow={quiz.total}
                      aria-valuemin={1}
                      aria-valuemax={quiz.playLimit}
                    >
                      <div
                        className="h-full rounded-full bg-[#61ff5f] transition-all duration-300"
                        style={{ width: `${quiz.progressPct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-[#6f9268]">
                      {quiz.total} / {quiz.playLimit}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#6f9268]">
                    <span>{quiz.score} 正解</span>
                    {quiz.bestStreak > 1 && (
                      <span className="font-semibold text-[#ffcf4a]">
                        🔥 {quiz.bestStreak}連続
                      </span>
                    )}
                    <span className="ml-auto rounded-full border border-[#3aa83a] px-2 py-0.5 text-[10px] font-bold text-[#61ff5f]">
                      ×{quiz.tierMultiplier}
                    </span>
                  </div>

                  {/* 問題カード */}
                  <div className="mt-2.5">
                    <QuestionCard
                      questionKey={quiz.questionKey}
                      partOfSpeech={quiz.partOfSpeech}
                      word={quiz.word}
                      dense
                    />
                  </div>

                  {/* 回答（文字盤固定） */}
                  <div className="mt-2.5">
                    <TileAnswerBoard {...tiles} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── 3. エティモンウィンドウ ── */}
        <footer className="relative z-20 h-28 shrink-0">
          <EtymonDock
            collection={dock.collection}
            onSelect={dock.onSelect}
            onOpenDrawer={dock.onOpenDrawer}
          />
        </footer>
      </div>
    </div>
  );
}
