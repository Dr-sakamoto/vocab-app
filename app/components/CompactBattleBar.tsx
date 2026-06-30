"use client";

import { Battle } from "@/lib/types";
import { getOpponentPokemon, getOpponentPokemonStatus, getTrainerSprite, isCapturableBattle } from "@/lib/storyBattles";

interface CompactBattleBarProps {
  battle: Battle | null;
  questionNumber: number;
  playLimit: number;
  currentAccuracy?: number;
  masterBallAvailable?: boolean;
  useMasterBall?: boolean;
  onToggleMasterBall?: () => void;
}

export default function CompactBattleBar({
  battle,
  questionNumber,
  playLimit,
  currentAccuracy = 0,
  masterBallAvailable = false,
  useMasterBall = false,
  onToggleMasterBall,
}: CompactBattleBarProps) {
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
          <div className="mt-1 flex flex-wrap gap-2">
            {pokemonStatus.map((status: any) => (
              <span
                key={status.index}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold ${
                  status.isActive
                    ? "bg-white text-rose-700"
                    : status.isDefeated
                      ? "bg-emerald-500 text-white"
                      : "bg-white/20 text-white"
                }`}
              >
                {status.isActive ? "▶" : status.isDefeated ? "✓" : "○"}
                <span className="truncate max-w-[4rem]">{status.name}</span>
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
          className={`w-full border-t border-white/20 px-4 py-3 text-center text-sm font-semibold ${
            useMasterBall ? "bg-violet-700 text-white" : "bg-black/10 text-rose-50"
          }`}
        >
          {useMasterBall ? "◎ マスターボール使用中" : "◎ マスターボールを使う"}
        </button>
      )}
    </div>
  );
}
