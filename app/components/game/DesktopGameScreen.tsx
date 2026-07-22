"use client";

import AuroraBackground from "../AuroraBackground";
import EtymonDock from "../EtymonDock";
import InlineResult from "../InlineResult";
import WorldWindow from "../WorldWindow";
import QuestionCard from "./QuestionCard";
import TypingAnswerRow, { TypingAnswerRowProps } from "./TypingAnswerRow";
import {
  DockBlockProps,
  FANTASY_AURORA,
  QuizBlockProps,
  ResultBlockProps,
  WorldBlockProps,
} from "./screenProps";

export interface DesktopGameScreenProps {
  world: WorldBlockProps;
  quiz: QuizBlockProps;
  result: ResultBlockProps;
  typing: TypingAnswerRowProps;
  dock: DockBlockProps;
}

/**
 * PC版スクリーン。物理キーボードがあるので回答は常にタイピング。
 * 3ブロックを比率配分（44/31/25）で縦に積み、中央に最大幅で寄せる。
 * 問題欄はゲージのみに絞った分だけ縮め、その余白をワールド（ミッション
 * を全部見せる）と手持ちウィンドウ（大きく見せる）へ回している。
 */
export default function DesktopGameScreen({
  world,
  quiz,
  result,
  typing,
  dock,
}: DesktopGameScreenProps) {
  return (
    <div className="fantasy-shell relative h-screen overflow-hidden">
      <AuroraBackground vivid colors={FANTASY_AURORA} />
      <div className="scene-grid" aria-hidden />
      <div className="scene-vignette" aria-hidden />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col gap-3 p-3">
        {/* ── 1. ワールドウィンドウ ── */}
        <header className="min-h-0 basis-0 grow-[44]">
          <WorldWindow {...world} />
        </header>

        {/* ── 2. 問題ウィンドウ ── */}
        <main className="min-h-0 basis-0 grow-[31]">
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
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
                <div className="my-auto w-full px-6 py-4">
                  {/* プログレス行（ゲージのみ。正解数・問題数・tierの数値表示は
                      ワールド／手持ちウィンドウにスペースを譲るため撤去） */}
                  <div
                    className="gauge-track h-1.5 w-full overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuenow={quiz.total}
                    aria-valuemin={1}
                    aria-valuemax={quiz.playLimit}
                  >
                    <div
                      className="h-full rounded-full bg-[#f5f5f5] transition-all duration-300"
                      style={{ width: `${quiz.progressPct}%` }}
                    />
                  </div>

                  {/* 問題カード */}
                  <div className="mt-3">
                    <QuestionCard
                      questionKey={quiz.questionKey}
                      partOfSpeech={quiz.partOfSpeech}
                      word={quiz.word}
                      onSkip={quiz.onSkip}
                      skipDisabled={quiz.skipDisabled}
                    />
                  </div>

                  {/* 回答（タイピング） */}
                  <div className="mt-3">
                    <TypingAnswerRow {...typing} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── 3. エティモンウィンドウ ── */}
        <footer className="relative z-20 min-h-0 basis-0 grow-[25]">
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
