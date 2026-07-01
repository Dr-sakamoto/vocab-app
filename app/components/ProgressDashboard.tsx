"use client";

import React from "react";
import { motion } from "framer-motion";
import AuroraBackground from "./AuroraBackground";

const LEVEL_RING_COLORS: Record<number, string> = {
  0: "#d4d4d8",
  1: "#fef08a",
  2: "#fde047",
  3: "#a3e635",
  4: "#4ade80",
  5: "#15803d",
};

function masteryLevel(stat: any) {
  const c = stat?.correct ?? 0;
  const w = stat?.wrong ?? 0;
  const net = c - w;
  const attempts = c + w;
  if (attempts === 0) return 0;
  if (net <= -3) return 0;
  if (net <= 0) return 1;
  if (net <= 2) return 2;
  if (net <= 4) return 3;
  if (net <= 7) return 4;
  return 5;
}

function countLvAtLeast1(statsArr: any[]) {
  return statsArr.filter((s) => masteryLevel(s) >= 1).length;
}

function buildMasteryConicGradient(levelCounts: number[]) {
  const total = levelCounts.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return `conic-gradient(from -90deg, ${LEVEL_RING_COLORS[0]} 0deg 360deg)`;
  }

  let angle = 0;
  const stops = [];
  for (let lv = 0; lv <= 5; lv += 1) {
    const sweep = (levelCounts[lv] / total) * 360;
    if (sweep <= 0) continue;
    stops.push(`${LEVEL_RING_COLORS[lv]} ${angle}deg ${angle + sweep}deg`);
    angle += sweep;
  }

  if (stops.length === 0) {
    return `conic-gradient(from -90deg, ${LEVEL_RING_COLORS[0]} 0deg 360deg)`;
  }

  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

interface MasteryDonutChartProps {
  levelCounts: number[];
  lv1PlusPct: number;
}

function MasteryDonutChart({ levelCounts, lv1PlusPct }: MasteryDonutChartProps) {
  const clamped = Math.max(0, Math.min(100, lv1PlusPct));
  const ariaParts = [0, 1, 2, 3, 4, 5].map(
    (lv) => `レベル${lv}が${levelCounts[lv]}語`,
  );
  const chartLabel = `習熟度の円グラフ。${ariaParts.join("。")}。Lv.1以上の割合は${Math.round(clamped)}パーセント。`;

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, rotate: -90 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        className="relative inline-flex h-[152px] w-[152px] shrink-0 items-center justify-center"
        role="img"
        aria-label={chartLabel}
      >
        <div
          className="absolute inset-0 rounded-full shadow-md shadow-indigo-100 transition-[background] duration-500"
          style={{
            background: buildMasteryConicGradient(levelCounts),
            WebkitMask:
              "radial-gradient(circle, transparent 52%, black calc(52% + 1px))",
            mask: "radial-gradient(circle, transparent 52%, black calc(52% + 1px))",
          }}
          aria-hidden
        />
        <div className="pointer-events-none relative z-10 text-center">
          <div className="text-2xl font-semibold tabular-nums text-emerald-900">
            {Math.round(clamped)}%
          </div>
          <div className="text-[11px] leading-tight text-zinc-500">
            Lv.1以上の割合
          </div>
        </div>
      </motion.div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-zinc-600">
        {[1, 2, 3, 4, 5].map((lv) => (
          <span key={lv} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-black/10"
              style={{ backgroundColor: LEVEL_RING_COLORS[lv] }}
              aria-hidden
            />
            Lv.{lv}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-black/10"
            style={{ backgroundColor: LEVEL_RING_COLORS[0] }}
            aria-hidden
          />
          Lv.0（未・苦手）
        </span>
      </div>
    </div>
  );
}

interface ProgressDashboardProps {
  stats: any[];
  totalWords: number;
  onBack: () => void;
}

export default function ProgressDashboard({
  stats,
  totalWords,
  onBack,
}: ProgressDashboardProps) {
  const lv1Plus = countLvAtLeast1(stats);
  const pct = totalWords === 0 ? 0 : (lv1Plus / totalWords) * 100;

  const levelCounts = [0, 1, 2, 3, 4, 5].map(
    (lv) => stats.filter((s) => masteryLevel(s) === lv).length,
  );

  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 text-zinc-900 flex items-center justify-center p-6">
      <AuroraBackground />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel relative z-10 w-full max-w-2xl rounded-3xl p-6 shadow-xl shadow-indigo-100/60"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">進捗ダッシュボード</h1>
          <motion.button
            type="button"
            onClick={onBack}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex h-12 min-w-32 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 px-5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            戻る
          </motion.button>
        </div>

        <p className="mt-2 text-sm text-zinc-600">
          全単語 <span className="font-semibold tabular-nums">{totalWords}</span> 語のうち、習熟 <span className="font-semibold">Lv.1 以上</span> （一度は正のネットスコアになった単語）が <span className="font-semibold tabular-nums">{lv1Plus}</span> 語です。
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:items-start sm:justify-around">
          <MasteryDonutChart levelCounts={levelCounts} lv1PlusPct={pct} />

          <div className="w-full max-w-sm space-y-3">
            <h2 className="text-sm font-semibold text-zinc-800">レベル別の単語数</h2>
            <ul className="space-y-2 text-sm">
              {[5, 4, 3, 2, 1, 0].map((lv, i) => (
                <motion.li
                  key={lv}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.15 + i * 0.05 }}
                  className="flex items-center justify-between rounded-lg bg-indigo-50/60 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-zinc-600">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-black/10"
                      style={{ backgroundColor: LEVEL_RING_COLORS[lv] }}
                      aria-hidden
                    />
                    Lv.{lv}
                    {lv === 0 ? "（未・苦手）" : ""}
                  </span>
                  <span className="tabular-nums font-medium">{levelCounts[lv]}</span>
                </motion.li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-zinc-500">
              Lv.は「正解−不正解」のネットに応じて 0〜5。未出題は Lv.0。英検学習では同じ問題に繰り返し答えるほどネットが上がります。
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
