"use client";

import { getStarterChoices } from "@/lib/starters";

export default function StarterChoiceModal({ onSelect }) {
  const choices = getStarterChoices();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-zinc-950">ポケモンを選ぶ</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          オーキド博士の研究所。最初のポケモンを1匹選んでください。
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {choices.map((choice) => (
            <button
              key={choice.lineId}
              type="button"
              onClick={() => onSelect(choice.lineId)}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <div className="mx-auto h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-inner">
                <img
                  src={choice.sprite}
                  alt=""
                  className="h-full w-full object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-950">{choice.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
