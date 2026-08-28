"use client";

import InlineResult, { RetentionSummary } from "../InlineResult";
import ModeTabs, { StudyMode } from "../ModeTabs";
import QuestionCard from "./QuestionCard";
import TypingAnswerRow, { TypingAnswerRowProps } from "./TypingAnswerRow";
import { PlayEvaluation, PoolTier } from "@/lib/types";

export interface StudyScreenProps {
  phase: "quiz" | "result";
  mode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  /** ヘッダーに出す学習の進み具合 */
  status: {
    score: number;
    total: number;
    playLimit: number;
    progressPct: number;
    streakDays: number;
    /** 実際に出題対象となっている語数（解放カウンタではなくプールの実数） */
    unlockedWordCount: number;
    totalWords: number;
    tier: PoolTier;
  };
  question: {
    questionKey: number;
    partOfSpeech: string;
    word: string;
    onSkip?: () => void;
    skipDisabled: boolean;
  };
  typing: TypingAnswerRowProps;
  result: {
    evaluation: PlayEvaluation | null;
    unlockedThisRun: number;
    /** 定着ドーナツの中身。セット終了後の定着語数と、その増減 */
    retention: RetentionSummary;
    onContinue: () => void;
  };
  onOpenSettings: () => void;
}

/**
 * 単一画面の学習スクリーン。
 *
 * 画面遷移を持たず、10問区切りのリザルトも問題ウィンドウの中身だけを
 * 入れ替えて見せる（連続プレイのフロー状態を切らさない）。
 * 回答はPC・スマホともにタイピング固定。日本語IMEで自由記述し、
 * 完全一致で拾えない表記ゆれはAI判定に回す。
 */
export default function StudyScreen({
  phase,
  mode,
  onModeChange,
  status,
  question,
  typing,
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
              <span className="tabular-nums">
                <span className="text-ink-1">{status.score}</span>
                {" / "}
                {status.playLimit} 正解
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
            aria-valuenow={status.total}
            aria-valuemin={1}
            aria-valuemax={status.playLimit}
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
              playLimit={status.playLimit}
              unlockedThisRun={result.unlockedThisRun}
              retention={result.retention}
              tierColor={status.tier.color}
              onContinue={result.onContinue}
            />
          ) : (
            /* 上詰め固定。判定後に結果表示が増えても問題カードの位置がズレない */
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="w-full px-1 pt-2">
                <QuestionCard
                  questionKey={question.questionKey}
                  partOfSpeech={question.partOfSpeech}
                  word={question.word}
                  onSkip={question.onSkip}
                  skipDisabled={question.skipDisabled}
                />
                <div className="mt-3">
                  <TypingAnswerRow {...typing} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
