"use client";

import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/55 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="glass-panel w-full max-w-lg rounded-3xl p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-zinc-950">化石を復元する</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {group.location}の研究所で、復元する化石を1つ選んでください。
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(group.choices ?? []).map((choice, i) => {
            const line = getMonsterLine(choice.lineId);
            const species = getSpecies(group.level ?? 30, choice.lineId);
            return (
              <motion.button
                key={choice.lineId}
                type="button"
                onClick={() => onSelect(choice.lineId)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.1 + i * 0.06 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center transition-colors hover:border-sky-300 hover:bg-sky-50"
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
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
