"use client";

export default function ResultScreen({
  score,
  bestStreak,
  playLimit,
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

        <div className="mt-5 rounded-xl bg-zinc-50 p-4">
          <div className="text-lg leading-8">
            最終スコア: <span className="font-semibold">{score}</span> / {playLimit}
          </div>
          <div className="mt-2 text-sm text-zinc-600">最高ストリーク: {bestStreak}</div>
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
