"use client";

import Link from "next/link";
import InlineResult, { RetentionSummary } from "../InlineResult";
import ModeTabs, { StudyMode } from "../ModeTabs";
import QuizSheet, { QuizSheetProps } from "./QuizSheet";
import { PlayEvaluation, PoolTier } from "@/lib/types";

export interface StudyScreenProps {
  phase: "quiz" | "result";
  mode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  /** ヘッダーに出す学習の進み具合 */
  status: {
    /** 確定済みの回答数。出題中は正解数を出さない（結果発表まで伏せる） */
    answered: number;
    /** このセットの問題数 */
    setSize: number;
    /** 結果発表でだけ使う正解数 */
    score: number;
    progressPct: number;
    streakDays: number;
    /** 実際に出題対象となっている語数（解放カウンタではなくプールの実数） */
    unlockedWordCount: number;
    totalWords: number;
    tier: PoolTier;
  };
  sheet: QuizSheetProps;
  /** 全問確定して、まだ返ってきていない採点を待っている状態 */
  isGrading: boolean;
  result: {
    evaluation: PlayEvaluation | null;
    unlockedThisRun: number;
    /** 定着ドーナツの中身。セット終了後の定着語数と、その増減 */
    retention: RetentionSummary;
    /** 復習する誤答が無いときだけ自動で次のセットへ流す */
    autoContinue: boolean;
    onContinue: () => void;
  };
  onOpenSettings: () => void;
}

/**
 * 単一画面の学習スクリーン。
 *
 * 画面遷移を持たず、10問の小テストとそのリザルトが問題ウィンドウの中身だけ
 * 入れ替わって見える（連続プレイのフロー状態を切らさない）。
 * 出題中の答案は常に上下2問（上＝採点中／採点済み、下＝回答中）で、
 * 1画面に収まってスクロールしない。
 * 回答はPC・スマホともにタイピング固定。日本語IMEで自由記述し、
 * 完全一致で拾えない表記ゆれはAI判定に回す。採点は回答の確定ごとに裏で走り、
 * 正誤は設問ごとに採点が返り次第見せる（随時採点）。
 */
export default function StudyScreen({
  phase,
  mode,
  onModeChange,
  status,
  sheet,
  isGrading,
  result,
  onOpenSettings,
}: StudyScreenProps) {
  return (
    <div className="quiz-shell app-shell relative flex h-dvh flex-col overflow-hidden">
      <div className="relative z-10 mx-auto flex h-full w-full max-w-2xl flex-col p-3">
        <header className="shrink-0">
          <div className="mb-1.5 flex justify-start">
            <ModeTabs mode={mode} onChange={onModeChange} />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-ink-3">
            <div className="flex items-center gap-3">
              {/* 出題中に正解数を出すと、そこで正誤が漏れて小テストにならない */}
              <span className="tabular-nums">
                {phase === "result" ? (
                  <>
                    <span className="text-ink-1">{status.score}</span>
                    {" / "}
                    {status.setSize} 正解
                  </>
                ) : (
                  <>
                    <span className="text-ink-1">{status.answered}</span>
                    {" / "}
                    {status.setSize} 回答
                  </>
                )}
              </span>
              {status.streakDays > 0 && (
                <span className="tabular-nums">連続 {status.streakDays} 日</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* 到達段階（CEFR）だけは色で示す。順序尺度なので明度が単調に上がる
                  連続スケールにしてある（lib/poolTier.ts）。 */}
              <span className="tabular-nums" style={{ color: status.tier.color }}>
                {status.tier.label}
              </span>
              <span className="tabular-nums">
                {status.unlockedWordCount} / {status.totalWords} 語
              </span>
              <Link
                href="/progress"
                aria-label="進捗を見る"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition hover:bg-surface-1 hover:text-ink-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 19V10" />
                  <path d="M11 19V5" />
                  <path d="M18 19v-7" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="設定を開く"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition hover:bg-surface-1 hover:text-ink-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>
            </div>
          </div>

          <div
            className="gauge-track mt-2 h-1 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={status.answered}
            aria-valuemin={0}
            aria-valuemax={status.setSize}
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${status.progressPct}%` }}
            />
          </div>
        </header>

        <main className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
          {phase === "result" ? (
            <InlineResult
              evaluation={result.evaluation}
              score={status.score}
              playLimit={status.setSize}
              unlockedThisRun={result.unlockedThisRun}
              retention={result.retention}
              autoContinue={result.autoContinue}
              answerSheet={<QuizSheet {...sheet} />}
              onContinue={result.onContinue}
            />
          ) : (
            /* 上詰め固定・スクロールなし。出題中に見えているのは上下2問だけで、
               下の答え合わせが済み次第、窓が1つずつ前へ進む。打っているあいだ
               答案が動かないので、次の設問を目で探し直す手間が要らない。 */
            <div className="min-h-0 flex-1 overflow-hidden">
              <div className="w-full px-1 pt-2 pb-4">
                <QuizSheet {...sheet} />

                {/* 全問打ち終えたのに採点が返っていないときだけ出る。
                    押すものが無いので割り込みにはならない（待ちの説明）。 */}
                {isGrading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-3">
                    <span className="ios-spinner" aria-hidden="true">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={i}
                          className="ios-spinner-bar"
                          style={{
                            transform: `rotate(${i * 30}deg)`,
                            animationDelay: `${-((12 - i) % 12) / 12}s`,
                          }}
                        />
                      ))}
                    </span>
                    採点中…
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
