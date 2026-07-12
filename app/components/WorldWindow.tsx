"use client";

import { motion, AnimatePresence } from "framer-motion";
import { WildEncounterState } from "@/lib/wildEncounter";
import { PoolTier } from "@/lib/types";

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
  if (ratio > 0.5) return "bg-[#61ff5f]";
  if (ratio > 0.25) return "bg-[#ffcf4a]";
  return "bg-[#ff5a5a]";
}

/**
 * ブロック1: ワールドウィンドウ（ハイファンタジースキン）。
 * 左から「出現エティモン（正方形の羊皮紙札）」「ミッションの巻物」
 * 「現在地の古地図（正方形マス）」。ラベル文字は置かず、素材感で伝える。
 * 両端は正方形を保ち、行の高さは親が決める（マスの一辺=行の高さ）。
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
      <div className="parchment flex h-full min-h-0 items-center gap-2 rounded-lg px-3">
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
            <span className="shrink-0 text-[11px] font-bold">
              Lv.{encounter.level}
            </span>
            <span className="min-w-0 truncate text-[11px] font-bold">
              {encounter.name}
            </span>
            <div
              className="gauge-track h-2 min-w-0 flex-1 overflow-hidden rounded-full"
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
            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[#6f9268]">
              ✓{doneCount}/{encounter.missions.length}
            </span>
          </>
        ) : (
          <span className="truncate text-[11px] text-[#6f9268]">
            つぎのエティモンをさがしている…
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-2 sm:gap-2.5">
      {/* 出現エティモン（正方形の札） */}
      <div className="parchment relative flex h-full aspect-square min-w-0 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg px-1.5 py-1">
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
              <div className="flex w-full items-baseline justify-center gap-1 text-[10px] font-bold sm:text-xs">
                <span className="shrink-0 tabular-nums text-[#ffcf4a]">
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
                style={{ imageRendering: "pixelated", maxHeight: "62%" }}
              />
              <div className="w-full">
                <div
                  className="gauge-track h-2 w-full overflow-hidden rounded-full"
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
                <div className="mt-0.5 text-center text-[9px] tabular-nums text-[#6f9268] sm:text-[11px]">
                  {encounter.hp} / {encounter.maxHP}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-1 text-center text-[10px] leading-relaxed text-[#6f9268]"
            >
              つぎのエティモンを
              <br />
              さがしている…
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ミッションの巻物（ラベルなし。チェックリストだけを置く） */}
      <div className="parchment min-w-0 flex-1 overflow-y-auto rounded-lg px-2.5 py-1.5">
        {encounter ? (
          <ul className="space-y-1 sm:space-y-1.5">
            {encounter.missions.map((mission) => (
              <li
                key={mission.id}
                className="flex items-start gap-1.5 text-[10px] leading-tight sm:text-sm"
              >
                <span
                  aria-hidden
                  className={`mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border text-[9px] font-bold sm:h-4 sm:w-4 ${
                    mission.done
                      ? "border-[#61ff5f] bg-[#61ff5f] text-[#06120a]"
                      : "border-[#3aa83a] bg-transparent text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span
                  className={
                    mission.done ? "text-[#6f9268] line-through" : "text-[#cfeecb]"
                  }
                >
                  {mission.label}
                  {mission.goal > 1 && !mission.done && (
                    <span className="ml-1 tabular-nums text-[#ffcf4a]">
                      {mission.progress}/{mission.goal}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-[#6f9268]">
            —
          </div>
        )}
      </div>

      {/* 現在地の古地図（正方形マス。タップで学習の記録を開く） */}
      <button
        type="button"
        onClick={onOpenProgress}
        className="old-map relative h-full aspect-square min-w-0 shrink-0 overflow-hidden rounded-lg px-2 py-1.5 text-left"
        aria-label={`現在地 ${habitatName}。タップで学習の記録を開く`}
      >
        <div className="flex h-full flex-col justify-between">
          <div className="min-w-0">
            <div className="truncate text-[11px] font-bold sm:text-sm">
              {habitatName}
            </div>
            {streakDays > 0 && (
              <div className="text-[9px] tabular-nums sm:text-[11px]">
                🔥{streakDays}日
              </div>
            )}
          </div>
          <div>
            <div className="text-[9px] font-semibold sm:text-[10px]">
              {tier.label} ×{tier.multiplier}
            </div>
            <div className="gauge-track mt-0.5 h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-[#ffcf4a]"
                style={{ width: `${poolPct}%` }}
              />
            </div>
            <div className="mt-0.5 text-right text-[9px] tabular-nums sm:text-[10px]">
              {unlockedPoolSize} / {totalWords}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
