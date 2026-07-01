"use client";

import { motion } from "framer-motion";
import { MonsterCollection } from "@/lib/types";
import { getPartyCount, getMonsterDisplayState, getPartySlots, normalizeMonsterCollection } from "@/lib/monster";

interface PokemonPartyProps {
  collection: MonsterCollection;
  onSelect?: (monsterId: string) => void;
}

export default function PokemonParty({ collection, onSelect }: PokemonPartyProps) {
  const normalized = normalizeMonsterCollection(collection);
  const slots = getPartySlots(normalized);

  return (
    <div className="rounded-xl border border-indigo-100/60 bg-white/90 backdrop-blur-sm p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-sm font-bold text-indigo-950">Party</h2>
        <span className="text-xs text-zinc-400">
          {getPartyCount(normalized)} / {slots.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {slots.map((monster, index) => {
          if (!monster) {
            return (
              <div
                key={`empty-${index}`}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-2 text-zinc-300"
                aria-label={`Empty party slot ${index + 1}`}
              >
                <span className="text-2xl leading-none">+</span>
                <span className="mt-1 text-[10px] font-medium uppercase">Empty</span>
              </div>
            );
          }

          const current = getMonsterDisplayState(monster);
          const isHoldingItem = Boolean(monster.heldItemType);
          const isActive = monster.id === normalized.activeId;

          return (
            <motion.button
              key={monster.id}
              type="button"
              onClick={() => onSelect?.(monster.id)}
              whileHover={onSelect ? { scale: 1.05, y: -2 } : undefined}
              whileTap={onSelect ? { scale: 0.96 } : undefined}
              className={[
                "flex aspect-square flex-col items-center justify-center rounded-lg border-2 bg-zinc-50 p-2 transition-colors",
                onSelect ? "hover:bg-white hover:border-indigo-300" : "",
                isActive ? "border-indigo-500 ring-2 ring-indigo-400/30 shadow-md shadow-indigo-200/60" : "border-transparent",
              ].join(" ")}
              aria-label={`${current.species.name} Lv. ${current.level}${isActive ? " active" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.species.sprite}
                alt=""
                aria-hidden="true"
                onError={(e) => {
                  if (e.currentTarget.src !== current.species.fallbackSprite) {
                    e.currentTarget.src = current.species.fallbackSprite;
                  }
                }}
                className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                style={{ imageRendering: "pixelated" }}
              />
              <span className={["mt-1 max-w-full truncate text-[11px] font-medium", isHoldingItem ? "text-sky-600" : "text-zinc-700"].join(" ")}>
                {current.species.name}
              </span>
              <span className="text-[10px] tabular-nums text-zinc-400">
                Lv. {current.level}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
