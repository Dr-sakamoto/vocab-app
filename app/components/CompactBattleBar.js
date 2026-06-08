"use client";

import { getOpponentPokemon, getOpponentPokemonStatus, getTrainerSprite, isCapturableBattle } from "@/lib/storyBattles";

export default function CompactBattleBar({
  battle,
  questionNumber,
  playLimit,
  currentAccuracy = 0,
  masterBallAvailable = false,
  useMasterBall = false,
  onToggleMasterBall,
}) {
  if (!battle) return null;

  const opponent = getOpponentPokemon(battle, questionNumber, playLimit, currentAccuracy);
  const pokemonStatus = getOpponentPokemonStatus(battle, questionNumber, playLimit, currentAccuracy);
  const trainerSprite = getTrainerSprite(battle);
  const capturable = isCapturableBattle(battle);

  return (
    <div className="shrink-0 border-b-2 border-rose-500 bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md">
      <div className="flex items-center gap-2 px-3 py-3">
        {trainerSprite ? (
          <img
            src={trainerSprite}
            alt=""
            className="h-12 w-12 shrink-0 object-contain object-bottom"
            style={{ imageRendering: "pixelated" }}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{battle.name}</p>
          <p className="truncate text-xs text-rose-100">{battle.location}</p>
          
          {/* ポケモンステータスをコンパクト表示 */}
          <div className="mt-1 flex gap-1.5">
            {pokemonStatus.map((status) => (
              <span
                key={status.index}
                className={`inline-block text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  status.isDefeated ? "bg-emerald-500 text-white" : "bg-white/20 text-white"
                }`}
              >
                {status.isDefeated ? "✓" : "○"} {status.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-2 py-2">
          <img
            src={opponent.sprite}
            alt=""
            className="h-10 w-10 object-contain"
            style={{ imageRendering: "pixelated" }}
          />
          <div className="text-right text-[12px] leading-tight">
            <p className="font-semibold">{opponent.name}</p>
            <p className="text-rose-100">Lv.{opponent.level} · {opponent.index + 1}/{opponent.total}</p>
          </div>
        </div>
      </div>

      {masterBallAvailable && capturable && (
        <button
          type="button"
          onClick={onToggleMasterBall}
          className={`w-full border-t border-white/20 px-3 py-1.5 text-center text-[11px] font-semibold ${
            useMasterBall ? "bg-violet-700 text-white" : "bg-black/10 text-rose-50"
          }`}
        >
          {useMasterBall ? "◎ マスターボール使用中" : "◎ マスターボールを使う"}
        </button>
      )}
    </div>
  );
}
