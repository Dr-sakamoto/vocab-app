"use client";

import Link from "next/link";
import RetentionRing from "../../components/game/RetentionRing";
import DailyGainChart from "../../components/DailyGainChart";
import { RETENTION_LEVELS } from "@/lib/retention";
import { useQuizGame } from "../../contexts/QuizGameContext";

/**
 * 進捗欄（`/progress`）。
 *
 * 収録語全体の定着レベル内訳をドーナツで、直近14日の定着語数の伸びを
 * 棒グラフで見せる。10問の出題フローには属さない独立ページなので、
 * ここへの行き来は出題中の割り込みにはならない
 * （ヘッダーのアイコンから任意のタイミングで開く）。
 */
export default function ProgressPage() {
  const { progress } = useQuizGame();
  const { levelCounts, totalWords, dailyGains } = progress;

  const totalMastered = levelCounts[5] ?? 0;
  const latestGain = dailyGains[dailyGains.length - 1]?.gain ?? 0;

  return (
    <div className="app-shell min-h-dvh p-3">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 py-3">
        <header className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="出題画面へ戻る"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-3 transition hover:bg-surface-1 hover:text-ink-2"
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
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-sm text-ink-1">進捗</h1>
        </header>

        <div className="prompt-card p-4">
          <h2 className="text-xs text-ink-3">定着レベルの内訳（収録語全体）</h2>
          <div className="mt-3 flex items-center gap-4">
            <RetentionRing levelCounts={levelCounts} poolSize={totalWords} />
            <div className="min-w-0">
              <div className="tabular-nums text-lg text-ink-1">
                {totalMastered.toLocaleString()}
                <span className="ml-1 text-xs text-ink-3">
                  / {totalWords.toLocaleString()} 語が定着（Lv.5）
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {RETENTION_LEVELS.map(({ level, label, color }) => (
              <div key={level} className="flex items-center gap-1 text-[11px] text-ink-3">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span>{label}</span>
                <span className="tabular-nums">{(levelCounts[level] ?? 0).toLocaleString()}語</span>
              </div>
            ))}
          </div>
        </div>

        <div className="prompt-card p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs text-ink-3">毎日の伸び率（直近14日）</h2>
            <span
              className="tabular-nums text-xs"
              style={{
                color:
                  latestGain > 0
                    ? "var(--positive)"
                    : latestGain < 0
                      ? "var(--negative)"
                      : "var(--ink-3)",
              }}
            >
              今日 {latestGain > 0 ? `+${latestGain}` : latestGain} 語
            </span>
          </div>
          <div className="mt-3">
            <DailyGainChart points={dailyGains} />
          </div>
        </div>
      </div>
    </div>
  );
}
