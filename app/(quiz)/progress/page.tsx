"use client";

import Link from "next/link";
import RetentionRing from "../../components/game/RetentionRing";
import DailyGainChart from "../../components/DailyGainChart";
import ActivityCalendar from "../../components/ActivityCalendar";
import { RETENTION_LEVELS } from "@/lib/retention";
import { ProgressProps, useQuizGame } from "../../contexts/QuizGameContext";
import { schemeColor } from "@/lib/schemeColor";

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
  const { levelCounts, totalWords, dailyGains, exam, calendar } = progress;

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

        {exam ? <ExamCard exam={exam} /> : (
          <div className="prompt-card p-4 text-xs text-ink-3">
            設定で試験日を入れると、ここに残り日数と到達見込みが出る
          </div>
        )}

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
            {RETENTION_LEVELS.map(({ level, label, color, lightColor }) => (
              <div key={level} className="flex items-center gap-1 text-[11px] text-ink-3">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: schemeColor({ color, lightColor }) }}
                />
                <span>{label}</span>
                <span className="tabular-nums">{(levelCounts[level] ?? 0).toLocaleString()}語</span>
              </div>
            ))}
          </div>
        </div>

        <div className="prompt-card p-4">
          <h2 className="text-xs text-ink-3">学習カレンダー（直近8週）</h2>
          <div className="mt-3">
            <ActivityCalendar weeks={calendar} />
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

/** "M/D"。基準日と年が違うときだけ年も付ける（到達見込みが翌年以降になる場合） */
function formatDate(key: string, refKey: string = key): string {
  const [y, m, d] = key.split("-").map(Number);
  return y === Number(refKey.slice(0, 4)) ? `${m}/${d}` : `${y}/${m}/${d}`;
}

/**
 * 試験日までの距離。「準1級に受かる」という遠い目標を、残り日数と
 * 1日あたりの語数という手元の数字に変換して見せる。
 * 目標は「収録語をすべて定着させる」。合格ラインを推測で作らない。
 */
function ExamCard({ exam }: { exam: NonNullable<ProgressProps["exam"]> }) {
  const { daysLeft, remaining, requiredPerDay, pacePerDay, projectedDate, onTrack } = exam;
  return (
    <div className="prompt-card p-4">
      <h2 className="text-xs text-ink-3">試験まで（{formatDate(exam.examDate)}）</h2>
      <div className="mt-2 tabular-nums text-lg text-ink-1">
        {daysLeft > 0 ? (
          <>
            あと {daysLeft}
            <span className="ml-1 text-xs text-ink-3">日</span>
          </>
        ) : daysLeft === 0 ? (
          "今日が試験日"
        ) : (
          <span className="text-sm text-ink-2">試験日を過ぎている。設定で次の試験日を入れられる</span>
        )}
      </div>
      {daysLeft >= 0 && (
        <div className="mt-2 space-y-1 text-xs tabular-nums text-ink-2">
          <div>
            未定着 {remaining.toLocaleString()} 語
            {requiredPerDay !== null && remaining > 0 && (
              <span className="text-ink-3"> · 間に合わせるには 1日 {requiredPerDay} 語</span>
            )}
          </div>
          <div>
            直近のペース 1日 {pacePerDay.toFixed(1)} 語
            {projectedDate && remaining > 0 && (
              <span style={{ color: onTrack ? "var(--positive)" : "var(--ink-3)" }}>
                {" "}· このままなら {formatDate(projectedDate, exam.examDate)} に全語定着
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
