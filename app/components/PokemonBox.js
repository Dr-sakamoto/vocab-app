"use client";

import { getAvailableMonsterLines, getMonsterState } from "@/lib/monster";

export default function PokemonBox({ selectedLineId, totalXP = 0, onSelect }) {
  const lines = getAvailableMonsterLines();

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {lines.map(line => {
          const current = getMonsterState(totalXP, line.id);
          const selected = line.id === selectedLineId;

          return (
            <button
              key={line.id}
              type="button"
              onClick={() => onSelect(line.id)}
              aria-label={line.name}
              aria-pressed={selected}
              className={[
                "group flex aspect-square flex-col items-center justify-center rounded-lg border-2 bg-zinc-50 p-2 transition",
                selected
                  ? "border-zinc-950 ring-2 ring-zinc-950/10"
                  : "border-transparent hover:border-zinc-300 hover:bg-white",
              ].join(" ")}
            >
              <img
                src={current.species.sprite}
                alt=""
                aria-hidden="true"
                onError={e => {
                  if (e.currentTarget.src !== current.species.fallbackSprite) {
                    e.currentTarget.src = current.species.fallbackSprite;
                  }
                }}
                className="h-16 w-16 object-contain"
                style={{ imageRendering: "pixelated" }}
              />
              <span className="mt-1 max-w-full truncate text-xs font-medium text-zinc-700">
                {current.species.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
