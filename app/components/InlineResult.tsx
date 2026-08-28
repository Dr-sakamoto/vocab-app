"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import RetentionRing from "./game/RetentionRing";
import { RETENTION_LEVELS } from "@/lib/retention";
import { PlayEvaluation } from "@/lib/types";

const AUTO_CONTINUE_SECONDS = 10;

export interface RetentionSummary {
  /** 解放プールのうち定着済みの語数（このセット終了後の値） */
  retained: number;
  /** 実際に出題対象となっている語数 */
  poolSize: number;
  /** このセットで定着済みが何語増えたか。減った場合は負の数 */
  gain: number;
  /** 出題プールの語を定着レベル（未出題＋Lv.1〜Lv.5の6段階）ごとに数えたもの。添字は level と一致 */
  levelCounts: number[];
}

interface InlineResultProps {
  evaluation: PlayEvaluation | null;
  score: number;
  playLimit: number;
  unlockedThisRun: number;
  retention: RetentionSummary;
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
  retention,
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

  const { grade, title, message, breakdown } = evaluation ?? {};

  const { retained, poolSize, gain, levelCounts } = retention;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-0 flex-col"
      onClick={onContinue}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 sm:px-6">
        <div className="prompt-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut", delay: 0.1 }}
                className="text-3xl text-ink-1"
              >
                {grade}
              </motion.span>
              <span className="text-sm text-ink-2">{title}</span>
            </div>
            <div className="text-sm tabular-nums text-ink-3">
              {score} / {playLimit} 正解
            </div>
          </div>

          {/* セットの成果は「解放プールのうち何語が定着したか」で見せる。
              プールが解放されると分母が増えて割合は下がりうるので、
              割合の隣に必ず実数の増減（+N語）を添える。 */}
          <div className="mt-2 flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2">
            <RetentionRing levelCounts={levelCounts} poolSize={poolSize} />
            <div className="min-w-0">
              <div className="tabular-nums text-xs text-ink-3">
                定着 {retained.toLocaleString()} / 出題プール{" "}
                {poolSize.toLocaleString()} 語
              </div>
              <div
                className="tabular-nums text-sm"
                style={{
                  color:
                    gain > 0
                      ? "var(--positive)"
                      : gain < 0
                        ? "var(--negative)"
                        : "var(--ink-3)",
                }}
              >
                {gain > 0
                  ? `+${gain} 語が定着した`
                  : gain < 0
                    ? `${gain} 語が定着から外れた`
                    : "定着した語の増減なし"}
              </div>
            </div>
          </div>

          {/* ドーナツの色分けが何を指しているかを、実数つきの凡例として文字でも出す。
              色の意味を色だけに頼らせない（判定色の凡例と同じ考え方）。 */}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 px-1">
            {RETENTION_LEVELS.map(({ level, label, color }) => (
              <div key={level} className="flex items-center gap-1 text-[11px] text-ink-3">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{label}</span>
                <span className="tabular-nums">{(levelCounts[level] ?? 0).toLocaleString()}語</span>
              </div>
            ))}
          </div>

          {message && (
            <p className="mt-2 text-xs leading-relaxed text-ink-2">{message}</p>
          )}

          {/* 解放は稀にしか起きない前進の合図。ここは操作色を使ってよい */}
          {unlockedThisRun > 0 && (
            <div className="mt-2 rounded-md border-l-2 border-accent bg-surface-2 px-2.5 py-1.5 text-xs text-accent">
              新たに {unlockedThisRun} 語がプールに追加された
            </div>
          )}

          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {breakdown?.map((item) => (
              <div
                key={item.label}
                className="rounded-md bg-surface-2 px-2.5 py-1.5 text-xs text-ink-2"
              >
                <div>{item.label}</div>
                <div className="mt-0.5 text-[11px] text-ink-3">{item.detail}</div>
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
          className="btn-accent flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm"
        >
          次のセットへ →
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15 text-xs tabular-nums">
            {secondsLeft}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
