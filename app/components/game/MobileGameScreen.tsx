"use client";

import AuroraBackground from "../AuroraBackground";
import EtymonPartySheet from "../EtymonPartySheet";
import InlineResult from "../InlineResult";
import WorldWindow from "../WorldWindow";
import QuestionCard from "./QuestionCard";
import TileAnswerBoard, { TileAnswerBoardProps } from "./TileAnswerBoard";
import { getHabitatTheme } from "@/lib/habitatTheme";
import {
  DockBlockProps,
  DrawerBlockProps,
  QuizBlockProps,
  ResultBlockProps,
  WorldBlockProps,
} from "./screenProps";
import type { CSSProperties } from "react";

export interface MobileGameScreenProps {
  world: WorldBlockProps;
  quiz: QuizBlockProps;
  result: ResultBlockProps;
  tiles: TileAnswerBoardProps;
  dock: DockBlockProps;
  drawer: DrawerBlockProps;
}

/**
 * スマホ版スクリーン。上から「敵とミッション → 問題 → 手持ち」の順。
 * - 最上段はワールドウィンドウ（敵エティモン＋ミッション帯）。今後
 *   tips・フレーバーテキスト・ストーリー表示など情報量が増える予定の
 *   エリアなので、視線の起点になる最上段に置く
 * - 問題ウィンドウは中段（残り全部）。文字盤が画面最下端に張り付くと
 *   打ちにくいため、タップ操作は中段に集める
 * - 最下段はエティモンウィンドウ（手持ち編成）。タップ頻度・表示の
 *   変化がもっとも少ないため画面端に置く。持ち手の上方向ドラッグで
 *   編成ドロワーが開く設計とも整合する
 * - 問題ウィンドウは上詰め固定。判定後に選択肢が消えても問題カードの
 *   位置がズレない（正解時の視覚的なジャンプを防ぐ）
 * - 回答は文字盤（みんはや式・1文字ずつタップ）固定。キーボードは一切出さない
 *   ので、タイピングやキーボード折りたたみの分岐は持たない
 */
export default function MobileGameScreen({
  world,
  quiz,
  result,
  tiles,
  dock,
  drawer,
}: MobileGameScreenProps) {
  const theme = getHabitatTheme(world.encounter?.habitatId ?? world.fallbackHabitatId);
  return (
    <div
      className="quiz-shell fantasy-shell relative h-dvh overflow-hidden"
      style={{ "--field-dots-glow": theme.dotsGlow } as CSSProperties}
    >
      <AuroraBackground colors={theme.aurora} />
      <div className="field-dots field-dots-1" aria-hidden />
      <div className="field-dots field-dots-2" aria-hidden />
      <div className="scene-vignette" aria-hidden />

      <div className="relative z-10 flex h-full w-full flex-col gap-2 p-2">
        {/* ── 1. ワールドウィンドウ（敵エティモン＋ミッション帯。
             ミッションを全部スクロールなしで見せるため、問題欄をゲージ
             のみに絞って空いた分だけ縦を広げている） ── */}
        <div className="h-40 shrink-0">
          <WorldWindow {...world} />
        </div>

        {/* ── 2. 問題ウィンドウ（残り全部。判定後に選択肢が消えても
             問題カードの位置がズレないよう上詰めで固定する） ── */}
        <main className="min-h-0 flex-1">
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
                <div className="w-full px-3 py-3">
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
                  <div className="mt-2.5">
                    <QuestionCard
                      questionKey={quiz.questionKey}
                      partOfSpeech={quiz.partOfSpeech}
                      word={quiz.word}
                      dense
                    />
                  </div>

                  {/* 回答（文字盤固定。「わからない」は操作列で戻すボタンの左に置く） */}
                  <div className="mt-2.5">
                    <TileAnswerBoard
                      {...tiles}
                      onSkip={quiz.onSkip}
                      skipDisabled={quiz.skipDisabled}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── 3. エティモンウィンドウ（手持ち編成。最下段に固定配置。
             持ち手を上へ引くと控えボックスが下から地続きにせり上がる。
             背景・ボックス面は fixed で全画面に展開するため、この footer は
             手持ち欄（のぞき見）ぶんの高さを確保する枠として機能する） ── */}
        <footer className="relative z-20 h-32 shrink-0">
          <EtymonPartySheet
            collection={dock.collection}
            onSelect={dock.onSelect}
            open={drawer.open}
            onOpenChange={drawer.onOpenChange}
            limit={drawer.limit}
            forceManage={drawer.forceManage}
            onSwap={drawer.onSwap}
            onRemove={drawer.onRemove}
            onSendToProfessor={drawer.onSendToProfessor}
            onSortBox={drawer.onSortBox}
            onOpenSync={drawer.onOpenSync}
          />
        </footer>
      </div>
    </div>
  );
}
