"use client";

import { getMonsterLine, getSpecies } from "@/lib/monster";

interface FossilChoice {
  lineId: string;
}

interface FossilGroup {
  location?: string;
  level?: number;
  choices?: FossilChoice[];
  [key: string]: any;
}

interface FossilChoiceModalProps {
  group: FossilGroup | null;
  onSelect: (lineId: string) => void;
}

export default function FossilChoiceModal({ group, onSelect }: FossilChoiceModalProps) {
  if (!group) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/55 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-zinc-950">化石を復元する</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {group.location}の研究所で、復元する化石を1つ選んでください。
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(group.choices ?? []).map((choice) => {
            const line = getMonsterLine(choice.lineId);
            const species = getSpecies(group.level ?? 30, choice.lineId);
            return (
              <button
                key={choice.lineId}
                type="button"
                onClick={() => onSelect(choice.lineId)}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center transition hover:border-sky-300 hover:bg-sky-50"
              >
                <div className="mx-auto h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-inner">
                  <img
                    src={species.sprite}
                    alt=""
                    className="h-full w-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-950">{line?.name ?? choice.lineId}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
