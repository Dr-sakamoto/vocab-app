"use client";

export default function ResultScreen({
  score,
  bestStreak,
  playLimit,
  unlockedPoolSize,
  totalWords,
  unlockedThisRun,
  evaluation,
  onRestart,
  onOpenDashboard,
  onBackToStart,
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">結果</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-zinc-500">
              Score: {score} / {playLimit}
            </div>
          </div>
        </div>

        {evaluation && (
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Learning Grade
                </div>
                <div className="mt-1 text-3xl font-semibold text-emerald-950">
                  {evaluation.grade}
                  <span className="ml-3 align-middle text-base font-medium text-emerald-800">
                    {evaluation.title}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold tabular-nums text-emerald-950">
                  {evaluation.score}
                </div>
                <div className="text-xs text-emerald-700">
                  / {evaluation.maxScore ?? 100}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-emerald-900">
              {evaluation.message}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {evaluation.breakdown.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg bg-white/70 px-3 py-2 text-sm text-emerald-950 ring-1 ring-emerald-900/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.label}</span>
                    <span className="tabular-nums">
                      {item.points} / {item.max}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-emerald-700">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 rounded-xl bg-zinc-50 p-4">
          <div className="text-lg leading-8">
            最終スコア: <span className="font-semibold">{score}</span> / {playLimit}
          </div>
          <div className="mt-2 text-sm text-zinc-600">最高ストリーク: {bestStreak}</div>
          <div className="mt-2 text-sm text-zinc-600">
            出題プール: {unlockedPoolSize} / {totalWords} 語
          </div>
          {unlockedThisRun > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              新単語が {unlockedThisRun} 語 解放されました
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-800"
          >
            もう一度（10問）
          </button>
          <button
            type="button"
            onClick={onOpenDashboard}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            進捗ダッシュボード
          </button>
          <button
            type="button"
            onClick={onBackToStart}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            スタートに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
