"use client";

import { useState } from "react";
import {
  getBoxMonsters,
  getMonsterState,
  getPartySlots,
  normalizeMonsterCollection,
} from "@/lib/monster";

function MonsterTile({ monster, location, selected, active, buddySlot, boxTile, onPick }) {
  const current = monster ? getMonsterState(monster.totalXP, monster.lineId) : null;
  const isSelected =
    selected &&
    selected.area === location.area &&
    selected.index === location.index &&
    selected.id === location.id;

  if (!monster) {
    return (
      <div
        className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-emerald-200 bg-emerald-50/70 text-2xl font-light text-emerald-200"
        aria-label="empty"
      >
        +
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPick(location)}
      aria-pressed={!!isSelected}
      aria-label={`${current.species.name} Lv. ${current.level}`}
      className={[
        "relative flex aspect-square flex-col items-center justify-center rounded-lg border-2 p-2 transition",
        boxTile ? "bg-zinc-50 hover:bg-white" : "bg-emerald-50 hover:bg-emerald-100/70",
        buddySlot ? "border-zinc-950" : active ? "border-zinc-700" : "border-transparent",
        isSelected ? "ring-4 ring-sky-300 ring-offset-2" : "",
      ].join(" ")}
    >
      {buddySlot && (
        <span
          className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-black text-white"
          aria-hidden="true"
        >
          ★
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.species.sprite}
        alt=""
        aria-hidden="true"
        onError={e => {
          if (e.currentTarget.src !== current.species.fallbackSprite) {
            e.currentTarget.src = current.species.fallbackSprite;
          }
        }}
        className="h-14 w-14 object-contain sm:h-16 sm:w-16"
        style={{ imageRendering: "pixelated" }}
      />
      <span className="mt-1 max-w-full truncate text-[11px] font-medium text-zinc-700">
        {current.species.name}
      </span>
      <span className="text-[10px] tabular-nums text-zinc-400">Lv. {current.level}</span>
    </button>
  );
}

export default function PokemonBox({ collection, onClose, onSwap }) {
  const normalized = normalizeMonsterCollection(collection);
  const partySlots = getPartySlots(normalized);
  const boxMonsters = getBoxMonsters(normalized);
  const [selected, setSelected] = useState(null);

  const pick = location => {
    if (!selected) {
      setSelected(location);
      return;
    }

    const same =
      selected.area === location.area &&
      selected.index === location.index &&
      selected.id === location.id;
    if (!same) onSwap?.(selected, location);
    setSelected(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border bg-white p-4 shadow-xl sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-sm font-black text-white">
              ★
            </div>
            <h2 className="text-lg font-semibold text-zinc-950">ポケモン管理</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-xl leading-none text-zinc-500 hover:bg-zinc-50"
            aria-label="close"
          >
            ×
          </button>
        </div>

        <section className="rounded-xl border border-emerald-200 bg-emerald-100/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-black text-white">
              ★
            </span>
            <span className="text-sm font-semibold text-emerald-950">手持ち</span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {partySlots.map((monster, index) => (
              <MonsterTile
                key={monster?.id ?? `party-empty-${index}`}
                monster={monster}
                location={{ area: "party", index, id: monster?.id ?? null }}
                selected={selected}
                active={monster?.id === normalized.activeId}
                buddySlot={index === 0}
                onPick={pick}
              />
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-2 text-sm font-semibold text-zinc-700">ボックス</div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {boxMonsters.map((monster, index) => (
              <MonsterTile
                key={monster.id}
                monster={monster}
                location={{ area: "box", index, id: monster.id }}
                selected={selected}
                boxTile
                onPick={pick}
              />
            ))}
            {boxMonsters.length === 0 && (
              <div className="col-span-3 rounded-lg border border-dashed border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-400 sm:col-span-6">
                Empty
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
