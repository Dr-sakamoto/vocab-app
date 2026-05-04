"use client";

import MonsterCompanion from "./MonsterCompanion";

export default function ResultScreen({
  score,
  bestStreak,
  playLimit,
  unlockedPoolSize,
  totalWords,
  unlockedThisRun,
  evaluation,
  monsterTotalXP,   // 今セッション分を加算済みの累計 XP
  onRestart,
  onOpenDashboard,
  onBackToStart,
}) {
  const { grade, title, message, xp, tier, breakdown } = evaluation ?? {};

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm space-y-5">

        {/* ── ヘッダー ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">結果</h1>
          <div className="text-sm text-zinc-500">{score} / {playLimit} 正解</div>
        </div>

        {/* ── モンスター ── */}
        <MonsterCompanion
          totalXP={monsterTotalXP}
          gainedXP={xp ?? 0}
          size="md"
        />

        {/* ── グレード + XP ── */}
        {evaluation && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">

            {/* グレード行 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Learning Grade
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-950">{grade}</span>
                  <span className="text-base font-medium text-emerald-800">{title}</span>
                </div>
              </div>

              {/* プール倍率バッジ */}
              {tier && (
                <div
                  className="rounded-lg px-3 py-1.5 text-center text-white"
                  style={{ backgroundColor: tier.color }}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                    {tier.label}
                  </div>
                  <div className="text-lg font-bold tabular-nums">
                    ×{tier.multiplier}
                  </div>
                </div>
              )}
            </div>

            {/* XP メイン表示 */}
            <div className="mt-4 rounded-lg bg-white/80 px-4 py-3 text-center ring-1 ring-emerald-900/10">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                Experience Points
              </div>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black tabular-nums text-emerald-950 tracking-tight">
                  {(xp ?? 0).toLocaleString()}
                </span>
                <span className="text-2xl font-bold text-emerald-700">XP</span>
              </div>
            </div>

            {/* メッセージ */}
            <p className="mt-3 text-sm leading-relaxed text-emerald-900">{message}</p>

            {/* 内訳カード */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {breakdown?.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg bg-white/70 px-3 py-2 text-sm text-emerald-950 ring-1 ring-emerald-900/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.label}</span>
                    <span className="tabular-nums font-semibold">
                      +{item.points.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-emerald-700">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 補足情報 ── */}
        <div className="rounded-xl bg-zinc-50 p-4 space-y-1.5 text-sm text-zinc-600">
          <div>最高ストリーク: <span className="font-semibold">{bestStreak}</span></div>
          <div>出題プール: {unlockedPoolSize} / {totalWords} 語</div>
          {unlockedThisRun > 0 && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              🔓 新単語が {unlockedThisRun} 語 解放されました
            </div>
          )}
        </div>

        {/* ── アクション ── */}
        <div className="flex flex-wrap items-center gap-3">
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