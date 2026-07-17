"use client";

import { useState } from "react";
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
  /** スマホでキーボード表示中: 1行のスリム表示にして問題に集中させる */
  compact?: boolean;
}

function hpBarColor(ratio: number): string {
  if (ratio > 0.5) return "bg-[#f5f5f5]";
  if (ratio > 0.25) return "bg-[#ffcf4a]";
  return "bg-[#ff5a5a]";
}

/** 収集済み単語プールの進捗を表すドーナツ（正方形の札に収まるリング表示） */
function PoolDonut({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <svg viewBox="0 0 36 36" className="h-full max-h-12 w-full max-w-12 -rotate-90 sm:max-h-14 sm:max-w-14">
      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#9a9a9a" strokeOpacity="0.35" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        r="15.9155"
        fill="none"
        stroke="#ffcf4a"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${clamped} ${100 - clamped}`}
      />
    </svg>
  );
}

/**
 * ブロック1: ワールドウィンドウ（ハイファンタジースキン）。
 * 左から「出現エティモン／進捗の正方形の羊皮紙札（タップで表示切替）」
 * 「ミッションの巻物（横長）」。ラベル文字は置かず、素材感で伝える。
 * 左端は正方形を保ち、行の高さは親が決める（マスの一辺=行の高さ）。
 */
export default function WorldWindow({
  encounter,
  fallbackHabitatName,
  tier,
  unlockedPoolSize,
  totalWords,
  streakDays,
  compact = false,
}: WorldWindowProps) {
  const [showProgress, setShowProgress] = useState(false);
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
            <span className="font-fantasy shrink-0 text-[11px] font-bold">
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
            <span className="font-fantasy shrink-0 text-[10px] font-semibold tabular-nums text-[#7d7d7d]">
              ✓{doneCount}/{encounter.missions.length}
            </span>
          </>
        ) : (
          <span className="truncate text-[11px] text-[#7d7d7d]">
            つぎのエティモンをさがしている…
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-2 sm:gap-2.5">
      {/* 出現エティモン／進捗（正方形の札。タップで表示を切り替える） */}
      <button
        type="button"
        onClick={() => setShowProgress((prev) => !prev)}
        className="parchment relative flex h-full aspect-square min-w-0 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg px-1.5 py-1 text-left"
        aria-label={
          showProgress
            ? "タップで現在地の表示に戻す"
            : "タップで学習の進捗を表示"
        }
      >
        <AnimatePresence mode="wait">
          {showProgress ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3 }}
              className="flex h-full w-full flex-col items-center justify-between"
            >
              <div className="w-full min-w-0">
                <div className="truncate text-center text-[10px] font-bold sm:text-xs">
                  {habitatName}
                </div>
              </div>
              <div
                className="relative flex flex-1 items-center justify-center"
                role="progressbar"
                aria-label={`収集済み単語 ${unlockedPoolSize} / ${totalWords}`}
                aria-valuenow={Math.round(poolPct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <PoolDonut percent={poolPct} />
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <span className="font-fantasy text-[10px] font-bold tabular-nums sm:text-xs">
                    {unlockedPoolSize}
                  </span>
                  <span className="font-fantasy text-[7px] tabular-nums text-[#7d7d7d] sm:text-[8px]">
                    /{totalWords}
                  </span>
                </div>
              </div>
              <div className="text-[9px] font-semibold sm:text-[10px]">
                {tier.label} <span className="font-fantasy">×{tier.multiplier}</span>
              </div>
            </motion.div>
          ) : encounter ? (
            <motion.div
              key={encounter.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3 }}
              className="flex h-full w-full min-h-0 flex-col items-center justify-center"
            >
              <div className="flex w-full items-baseline justify-center gap-1 text-[10px] font-bold sm:text-xs">
                <span className="font-fantasy shrink-0 tabular-nums text-[#ffcf4a]">
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
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full w-full flex-col items-center justify-center gap-1 text-center"
            >
              <span className="text-[9px] text-[#7d7d7d] sm:text-[10px]">現在地</span>
              <span className="truncate px-1 text-sm font-bold sm:text-base">
                {habitatName}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* ミッションの巻物（横長・ラベルなし）。冒頭に連続プレイ日数（ストリーク）、
          続けてエンカウントのチェックリスト */}
      <div className="parchment min-w-0 flex-1 overflow-y-auto rounded-lg px-2.5 py-1.5">
        {streakDays > 0 && (
          <div className="mb-1 flex items-center gap-1.5 border-b border-[#9a9a9a]/30 pb-1 text-[10px] font-bold sm:text-sm">
            <span aria-hidden>🔥</span>
            <span className="font-fantasy text-[#ffcf4a]">{streakDays}日連続の冒険</span>
          </div>
        )}
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
                      ? "border-[#f5f5f5] bg-[#f5f5f5] text-[#0a0a0a]"
                      : "border-[#9a9a9a] bg-transparent text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span
                  className={
                    mission.done ? "text-[#7d7d7d] line-through" : "text-[#e6e6e6]"
                  }
                >
                  {mission.label}
                  {mission.goal > 1 && !mission.done && (
                    <span className="font-fantasy ml-1 tabular-nums text-[#ffcf4a]">
                      {mission.progress}/{mission.goal}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-[#7d7d7d]">
            —
          </div>
        )}
      </div>
    </div>
  );
}
