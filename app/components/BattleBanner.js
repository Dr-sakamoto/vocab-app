"use client";

import { getOpponentPokemon, getOpponentPokemonStatus, getTrainerSprite, isCapturableBattle } from "@/lib/storyBattles";

export default function BattleBanner({
  battle,
  questionNumber,
  playLimit,
  currentAccuracy = 0,
  won,
  lost,
  masterBallAvailable = false,
  useMasterBall = false,
  onToggleMasterBall,
}) {
  if (!battle) return null;

  const opponent = getOpponentPokemon(battle, questionNumber, playLimit, currentAccuracy);
  const pokemonStatus = getOpponentPokemonStatus(battle, questionNumber, playLimit, currentAccuracy);
  const trainerSprite = getTrainerSprite(battle);
  const capturable = isCapturableBattle(battle);
  const tierLabel = battle.tier === "gym"
    ? "ジムリーダー"
    : battle.tier === "legendary"
      ? "伝説のポケモン"
      : battle.tier === "symbol"
        ? "シンボル"
        : battle.tier === "rocket"
          ? "ロケット団"
          : battle.tier === "elite"
            ? "四天王"
            : battle.tier === "champion"
              ? "チャンピオン"
              : "トレーナー";

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-rose-50 via-white to-rose-50 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-rose-200 bg-rose-500 px-4 py-2 text-white">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-100">{tierLabel}</p>
          <p className="truncate text-sm font-semibold">
            {battle.name}
            <span className="font-normal text-rose-100"> ＠{battle.location}</span>
          </p>
        </div>
        {won ? (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-rose-600">勝利！</span>
        ) : lost ? (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-700">敗北…</span>
        ) : (
          <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold">たたかい中</span>
        )}
      </div>

      <div className="flex items-stretch gap-3 px-4 py-3">
        {trainerSprite && (
          <div className="flex w-24 shrink-0 flex-col items-center justify-end">
            <div className="h-24 w-full overflow-hidden rounded-2xl bg-white shadow-inner ring-2 ring-rose-200">
              <img
                src={trainerSprite}
                alt=""
                className="h-full w-full object-contain object-bottom"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <p className="mt-1 text-center text-[10px] font-semibold text-rose-800">{battle.name}</p>
          </div>
        )}

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white shadow-inner ring-2 ring-sky-200">
            <img
              src={opponent.sprite}
              alt=""
              className="h-full w-full object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-zinc-950">
              {opponent.name}
              <span className="ml-2 text-sm font-medium text-zinc-500">Lv.{opponent.level}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              手持ち {opponent.index + 1} / {opponent.total}
            </p>
            
            {/* ポケモンのステータス表示 */}
            <div className="mt-2 flex flex-wrap gap-2">
              {pokemonStatus.map((status) => (
                <div
                  key={status.index}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    status.isActive
                      ? "bg-rose-600 text-white shadow"
                      : status.isDefeated
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {status.isActive ? "▶" : status.isDefeated ? "✓" : "○"} {status.name}
                </div>
              ))}
            </div>
            
            <p className="mt-2 text-xs text-rose-700">
              今戦っているポケモンを先頭に表示しています。
            </p>
          </div>
        </div>
      </div>

      {masterBallAvailable && capturable && !won && !lost && (
        <div className="border-t border-rose-100 bg-rose-50/80 px-4 py-3">
          <button
            type="button"
            onClick={onToggleMasterBall}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              useMasterBall
                ? "border-violet-500 bg-violet-600 text-white shadow-md"
                : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
            }`}
          >
            <span className="text-base">◎</span>
            {useMasterBall ? "マスターボールを使う（勝利時100%捕獲）" : "マスターボールを使う"}
          </button>
        </div>
      )}
    </div>
  );
}
