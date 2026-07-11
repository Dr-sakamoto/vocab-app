"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlayEvaluation } from "@/lib/types";

const AUTO_CONTINUE_SECONDS = 10;

interface InlineResultProps {
  evaluation: PlayEvaluation | null;
  score: number;
  playLimit: number;
  unlockedThisRun: number;
  onContinue: () => void;
}

/**
 * 10問区切りで問題ウィンドウの中身と入れ替わるリザルト。
 * ページ遷移せず、その場で評価を見せて自動で次のセットへ流す
 * （連続プレイのフロー状態を切らさない）。
 */
export default function InlineResult({
  evaluation,
  score,
  playLimit,
  unlockedThisRun,
  onContinue,
}: InlineResultProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CONTINUE_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onContinue();
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((seconds) => seconds - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, onContinue]);

  const { grade, title, message, xp, breakdown } = evaluation ?? {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-0 flex-col"
      onClick={onContinue}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 sm:px-6">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <motion.span
                initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
                className="font-display text-3xl font-bold text-emerald-950 drop-shadow-[0_0_14px_rgba(16,185,129,0.45)]"
              >
                {grade}
              </motion.span>
              <span className="text-sm font-medium text-emerald-800">{title}</span>
            </div>
            <div className="text-sm tabular-nums text-emerald-800">
              {score} / {playLimit} 正解
            </div>
          </div>

          <div className="relative mt-2 overflow-hidden rounded-lg bg-white/80 px-3 py-2 text-center ring-1 ring-emerald-900/10">
            <div className="shimmer-sweep" />
            <div className="relative flex items-baseline justify-center gap-1.5">
              <span className="font-display text-3xl font-bold tabular-nums text-emerald-950">
                {(xp ?? 0).toLocaleString()}
              </span>
              <span className="text-lg font-bold text-emerald-700">XP</span>
            </div>
          </div>

          {message && (
            <p className="mt-2 text-xs leading-relaxed text-emerald-900">{message}</p>
          )}

          {unlockedThisRun > 0 && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900">
              🔓 新単語が {unlockedThisRun} 語 解放されました
            </div>
          )}

          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {breakdown?.map((item) => (
              <div
                key={item.label}
                className="rounded-lg bg-white/70 px-2.5 py-1.5 text-xs text-emerald-950 ring-1 ring-emerald-900/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.label}</span>
                  <span className="tabular-nums font-semibold">
                    +{item.points.toLocaleString()} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-3 pt-2 sm:px-6">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          className="btn-3d btn-shine [--btn-edge:#52525b] flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black text-sm font-bold text-white"
        >
          次のセットへ →
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs tabular-nums">
            {secondsLeft}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
