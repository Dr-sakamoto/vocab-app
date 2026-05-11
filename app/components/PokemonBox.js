"use client";

import { getMonsterLine, getMonsterState, normalizeMonsterCollection } from "@/lib/monster";

export default function PokemonBox({ collection, onSelect }) {
  const normalized = normalizeMonsterCollection(collection);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {normalized.monsters.map(monster => {
          const line = getMonsterLine(monster.lineId);
          const current = getMonsterState(monster.totalXP, monster.lineId);
          const selected = monster.id === normalized.activeId;

          return (
            <button
              key={monster.id}
              type="button"
              onClick={() => onSelect(monster.id)}
              aria-label={`${line.name} Lv. ${current.level}`}
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
              <span className="text-[11px] tabular-nums text-zinc-400">
                Lv. {current.level}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
