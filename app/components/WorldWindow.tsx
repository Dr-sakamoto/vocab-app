"use client";

import { motion, AnimatePresence } from "framer-motion";
import { WildEncounterState } from "@/lib/wildEncounter";
import { PoolTier } from "@/lib/types";
import { getFieldPalette, fieldPaletteToCssVars } from "@/lib/fieldPalette";

interface WorldWindowProps {
  encounter: WildEncounterState | null;
  /** エンカウント不在時に表示する現在地 */
  fallbackHabitatName?: string;
  tier: PoolTier;
  unlockedPoolSize: number;
  totalWords: number;
  streakDays: number;
  onOpenProgress?: () => void;
  /** スマホでキーボード表示中: 1行のスリム表示にして問題に集中させる */
  compact?: boolean;
}

function hpBarColor(ratio: number): string {
  if (ratio > 0.5) return "bg-emerald-400";
  if (ratio > 0.25) return "bg-amber-400";
  return "bg-rose-500";
}

/**
 * ブロック1: ワールドウィンドウ。
 * 左から「出現エティモン」「ミッション」「現在地（マップ・進捗）」を
 * 1行に並べる。エティモン不在時は左2つを空欄にする。
 */
export default function WorldWindow({
  encounter,
  fallbackHabitatName,
  tier,
  unlockedPoolSize,
  totalWords,
  streakDays,
  onOpenProgress,
  compact = false,
}: WorldWindowProps) {
  const hpRatio = encounter ? encounter.hp / encounter.maxHP : 0;
  const habitatName = encounter?.habitatName || fallbackHabitatName || "—";
  const poolPct = Math.min(100, (unlockedPoolSize / Math.max(1, totalWords)) * 100);

  if (compact) {
    const doneCount = encounter
      ? encounter.missions.filter((mission) => mission.done).length
      : 0;
    return (
      <div className="glass-panel flex h-full min-h-0 items-center gap-2 rounded-xl px-3">
        {encounter ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={encounter.sprite}
              alt=""
              aria-hidden
              onError={(e) => {
                if (e.currentTarget.src !== encounter.fallbackSprite) {
                  e.currentTarget.src = encounter.fallbackSprite;
                }
              }}
              className="h-7 w-7 shrink-0 object-contain"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="shrink-0 text-[11px] font-bold text-indigo-950">
              Lv.{encounter.level}
            </span>
            <span className="min-w-0 truncate text-[11px] font-bold text-indigo-950">
              {encounter.name}
            </span>
            <div
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-200/80"
              role="progressbar"
              aria-label={`HP ${encounter.hp} / ${encounter.maxHP}`}
              aria-valuenow={encounter.hp}
              aria-valuemin={0}
              aria-valuemax={encounter.maxHP}
            >
              <div
                className={`h-full rounded-full ${hpBarColor(hpRatio)}`}
                style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-zinc-500">
              ✓{doneCount}/{encounter.missions.length}
            </span>
          </>
        ) : (
          <span className="truncate text-[11px] text-zinc-400">
            つぎのエティモンをさがしている…
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-2 sm:gap-2.5">
      {/* 出現エティモン */}
      <div className="glass-panel relative flex w-[30%] min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl px-2 py-1.5">
        <AnimatePresence mode="wait">
          {encounter ? (
            <motion.div
              key={encounter.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3 }}
              className="flex h-full w-full min-h-0 flex-col items-center justify-center"
            >
              <div className="flex w-full items-baseline justify-center gap-1 text-xs font-bold text-indigo-950 sm:text-sm">
                <span className="shrink-0 tabular-nums text-indigo-500">
                  Lv.{encounter.level}
                </span>
                <span className="truncate">{encounter.name}</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={encounter.sprite}
                alt={encounter.name}
                onError={(e) => {
                  if (e.currentTarget.src !== encounter.fallbackSprite) {
                    e.currentTarget.src = encounter.fallbackSprite;
                  }
                }}
                className="min-h-0 w-auto flex-1 object-contain py-0.5"
                style={{ imageRendering: "pixelated", maxHeight: "70%" }}
              />
              <div className="w-full">
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/80"
                  role="progressbar"
                  aria-label={`HP ${encounter.hp} / ${encounter.maxHP}`}
                  aria-valuenow={encounter.hp}
                  aria-valuemin={0}
                  aria-valuemax={encounter.maxHP}
                >
                  <motion.div
                    className={`h-full rounded-full ${hpBarColor(hpRatio)}`}
                    animate={{ width: `${Math.max(0, hpRatio * 100)}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-0.5 text-center text-[10px] tabular-nums text-zinc-500 sm:text-xs">
                  HP {encounter.hp} / {encounter.maxHP}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 text-center text-[10px] leading-relaxed text-zinc-400"
            >
              つぎのエティモンを
              <br />
              さがしている…
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ミッション */}
      <div className="glass-panel min-w-0 flex-1 overflow-y-auto rounded-2xl px-2.5 py-1.5">
        {encounter ? (
          <>
            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-indigo-400">
              Mission
            </div>
            <ul className="space-y-1.5">
              {encounter.missions.map((mission) => (
                <li
                  key={mission.id}
                  className="flex items-start gap-1.5 text-[11px] leading-tight sm:text-sm"
                >
                  <span
                    aria-hidden
                    className={`mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                      mission.done
                        ? "border-emerald-400 bg-emerald-400 text-white"
                        : "border-zinc-300 bg-white/70 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={
                      mission.done
                        ? "text-zinc-400 line-through"
                        : "text-zinc-700"
                    }
                  >
                    {mission.label}
                    {mission.goal > 1 && !mission.done && (
                      <span className="ml-1 tabular-nums text-indigo-400">
                        {mission.progress}/{mission.goal}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">
            ミッションなし
          </div>
        )}
      </div>

      {/* 現在地（マップ・進捗） */}
      <button
        type="button"
        onClick={onOpenProgress}
        style={fieldPaletteToCssVars(getFieldPalette(encounter?.habitatId))}
        className="field-marble relative w-[26%] min-w-0 overflow-hidden rounded-2xl px-2.5 py-1.5 text-left"
        aria-label={`現在地 ${habitatName}。タップで学習進捗を開く`}
      >
        <div className="field-dots field-dots-1" />
        <div className="relative z-10 flex h-full flex-col justify-between text-white [text-shadow:0_1px_6px_rgba(20,20,50,0.5)]">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">
              Map
            </div>
            <div className="truncate text-xs font-bold sm:text-base">
              {habitatName}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="rounded-full bg-black/30 px-1.5 py-px font-bold [text-shadow:none]">
                {tier.label} ×{tier.multiplier}
              </span>
              {streakDays > 0 && (
                <span className="tabular-nums">🔥{streakDays}</span>
              )}
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${poolPct}%` }}
              />
            </div>
            <div className="mt-0.5 text-right text-[10px] tabular-nums opacity-90">
              {unlockedPoolSize} / {totalWords}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
