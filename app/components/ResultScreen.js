"use client";

const PRIMARY_BUTTON_CLASS = "inline-flex h-12 min-w-32 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40";
const SECONDARY_BUTTON_CLASS = "inline-flex h-12 min-w-32 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-40";
const BATTLE_WIN_BUTTON_CLASS = "inline-flex h-12 min-w-32 items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 text-sm font-bold text-white shadow-lg shadow-rose-200 hover:from-rose-500 hover:to-red-500 disabled:opacity-40";

export default function ResultScreen({
  unlockedThisRun,
  evaluation,
  onRestart,
  onOpenDashboard,
  onBackToStart,
  battleResult = null,
  playLimit = 10,
  score = 0,
  masterBallAvailable = false,
  onUseMasterBall,
}) {
  const { grade, title, message, xp, tier, breakdown } = evaluation ?? {};
  const isBattle = Boolean(battleResult?.battle);
  const won = battleResult?.won;
  const lost = battleResult?.lost;
  const captureFailed = battleResult?.capture && !battleResult.capture.caught;
  const wildCaptureFailed = !isBattle && evaluation?.captureFailed && evaluation?.capturePreview?.lineId;
  const canMasterBallCatch = masterBallAvailable && captureFailed && battleResult?.capture?.lineId;
  const showWildMasterBall = masterBallAvailable && wildCaptureFailed;

  const shellClass = isBattle
    ? won
      ? "border-rose-200 bg-gradient-to-b from-rose-50 to-white"
      : "border-zinc-300 bg-gradient-to-b from-zinc-100 to-white"
    : "border-emerald-100 bg-emerald-50";

  const primaryLabel = isBattle
    ? won
      ? "スタートに戻る"
      : battleResult?.battle?.boss
        ? "もう一度挑戦"
        : "スタートに戻る"
    : `もう一度（${playLimit}問）`;

  const handlePrimary = isBattle && won ? onBackToStart : onRestart;

  return (
    <div className="bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center min-h-svh sm:min-h-screen p-4 sm:p-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-4 sm:p-6 shadow-sm space-y-5 my-auto">

        {isBattle && (
          <div className={`overflow-hidden rounded-2xl border-2 ${won ? "border-rose-500" : "border-zinc-400"}`}>
            <div className={`flex items-stretch ${won ? "bg-rose-500" : "bg-zinc-600"} text-white`}>
              {battleResult.trainerSprite ? (
                <div className="flex w-32 shrink-0 items-end justify-center bg-black/10 px-2 pb-2 pt-3">
                  <img
                    src={battleResult.trainerSprite}
                    alt=""
                    className="max-h-32 w-full object-contain object-bottom"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">
                  {won ? "バトル勝利" : "バトル敗北"}
                </p>
                <p className="mt-1 text-2xl font-black">
                  {won ? `${battleResult.battle.name}に勝った！` : `${battleResult.battle.name}に負けた…`}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  {battleResult.resultMessage}
                </p>
                <p className="mt-2 text-sm tabular-nums opacity-90">
                  スコア {score} / {playLimit}
                </p>
              </div>
              {battleResult.opponentSprite ? (
                <div className="flex w-24 shrink-0 items-center justify-center bg-black/10 p-3">
                  <img
                    src={battleResult.opponentSprite}
                    alt=""
                    className="h-20 w-20 object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handlePrimary}
          className={isBattle && !won && battleResult?.battle?.boss ? `${BATTLE_WIN_BUTTON_CLASS} w-full text-base` : `${PRIMARY_BUTTON_CLASS} w-full text-base`}
        >
          {primaryLabel}
        </button>

        {evaluation && (
          <div className={`rounded-xl border p-4 ${shellClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className={`text-xs font-medium uppercase tracking-wide ${isBattle ? "text-rose-700" : "text-emerald-700"}`}>
                  {isBattle ? "Battle Grade" : "Learning Grade"}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${isBattle ? "text-rose-950" : "text-emerald-950"}`}>{grade}</span>
                  <span className={`text-base font-medium ${isBattle ? "text-rose-800" : "text-emerald-800"}`}>{title}</span>
                </div>
              </div>

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

            <div className={`mt-4 rounded-lg bg-white/80 px-4 py-3 text-center ring-1 ${isBattle ? "ring-rose-900/10" : "ring-emerald-900/10"}`}>
              <div className={`text-[11px] font-semibold uppercase tracking-widest ${isBattle ? "text-rose-600" : "text-emerald-600"}`}>
                Experience Points
              </div>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className={`text-5xl font-black tabular-nums tracking-tight ${isBattle ? "text-rose-950" : "text-emerald-950"}`}>
                  {(xp ?? 0).toLocaleString()}
                </span>
                <span className={`text-2xl font-bold ${isBattle ? "text-rose-700" : "text-emerald-700"}`}>XP</span>
              </div>
            </div>

            <p className={`mt-3 text-sm leading-relaxed ${isBattle ? "text-rose-900" : "text-emerald-900"}`}>{message}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {breakdown?.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg bg-white/70 px-3 py-2 text-sm ring-1 ${isBattle ? "text-rose-950 ring-rose-900/5" : "text-emerald-950 ring-emerald-900/5"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.label}</span>
                    <span className="tabular-nums font-semibold">
                      +{item.points.toLocaleString()} XP
                    </span>
                  </div>
                  <div className={`mt-1 text-xs ${isBattle ? "text-rose-700" : "text-emerald-700"}`}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(canMasterBallCatch || showWildMasterBall) && onUseMasterBall && (
          <button
            type="button"
            onClick={onUseMasterBall}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-violet-400 bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:from-violet-500 hover:to-purple-500"
          >
            <span className="text-lg">◎</span>
            マスターボールを使って捕獲する
          </button>
        )}

        {unlockedThisRun > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            🔓 新単語が {unlockedThisRun} 語 解放されました
          </div>
        )}

        {!isBattle && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenDashboard}
              className={SECONDARY_BUTTON_CLASS}
            >
              進捗ダッシュボード
            </button>
            <button
              type="button"
              onClick={onBackToStart}
              className={SECONDARY_BUTTON_CLASS}
            >
              スタートに戻る
            </button>
          </div>
        )}

        {isBattle && (
          <div className="flex flex-wrap items-center gap-3">
            {!won && (
              <button
                type="button"
                onClick={onRestart}
                className={SECONDARY_BUTTON_CLASS}
              >
                すぐに再挑戦
              </button>
            )}
            <button
              type="button"
              onClick={onBackToStart}
              className={SECONDARY_BUTTON_CLASS}
            >
              スタートに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
