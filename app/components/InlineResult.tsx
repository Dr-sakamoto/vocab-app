"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import RetentionRing from "./game/RetentionRing";
import { RETENTION_LEVELS } from "@/lib/retention";
import { evaluateUnlockGate } from "@/lib/unlockGate";
import { GAME } from "@/lib/constants";
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
  /** 収録語の総数。プールがここまで届いていれば、もう解放するものが無い */
  totalWords: number;
}

interface InlineResultProps {
  evaluation: PlayEvaluation | null;
  score: number;
  playLimit: number;
  unlockedThisRun: number;
  retention: RetentionSummary;
  /**
   * 10問ぶんの答案（正誤つき）。要約より先に置く。
   * このセットで学べるものは「どの語を落としたか」なので、そこを主役にする。
   */
  answerSheet?: ReactNode;
  /**
   * 自動で次のセットへ流すか。読むべき誤答があるときは false にして、
   * 復習の途中で画面が切り替わらないようにする。
   */
  autoContinue?: boolean;
  onContinue: () => void;
}

/**
 * 10問の小テストが終わったところで、問題ウィンドウの中身と入れ替わる結果発表。
 * ページ遷移せず、答案（正誤つき）と評価をその場で見せる。
 *
 * 誤答が無ければ自動で次のセットへ流す（読むものが無いので止める理由がない）。
 * 誤答があるときは自動送りを止める。ここが「どの語を落としたか」を読む場で、
 * 読んでいる最中に画面が切り替わるほうが割り込みになる。
 * 面のどこを押しても進む挙動は持たない（答案をスクロールできなくなるため）。
 */
export default function InlineResult({
  evaluation,
  score,
  playLimit,
  unlockedThisRun,
  retention,
  answerSheet,
  autoContinue = true,
  onContinue,
}: InlineResultProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CONTINUE_SECONDS);

  useEffect(() => {
    if (!autoContinue) return undefined;
    if (secondsLeft <= 0) {
      onContinue();
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((seconds) => seconds - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [autoContinue, secondsLeft, onContinue]);

  const { grade, title, message } = evaluation ?? {};

  const { retained, poolSize, gain, levelCounts, totalWords } = retention;

  // 解放の条件はプール全体の分布で決まる（このセットの正答率では決まらない）。
  // 何が足りていないのかを出しておかないと、解放の有無が偶然に見えてしまう。
  const gate = evaluateUnlockGate(levelCounts);
  // 表示は必ず条件と同じ向きへ丸める。平均Lvは切り捨て、未正解の割合は
  // 切り上げ。四捨五入だと「2.0 と出ているのに解放されない」（実際は1.96）が
  // 起きて、数字が条件を説明できなくなる。
  const shownAvgLevel = (Math.floor(gate.avgLevel * 10) / 10).toFixed(1);
  const shownUnlearnedPct = Math.ceil(gate.unlearnedRatio * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 sm:px-6">
        {answerSheet && <div className="mb-4">{answerSheet}</div>}

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

          {/* 次の解放に何が足りていないか。どちらの数字もすぐ上のドーナツから
              読める値（中央の平均Lvと、いちばん暗い2色の割合）なので、
              新しい指標を覚えなくても対応が付く。 */}
          {poolSize > 0 && poolSize < totalWords && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-md bg-surface-2 px-2.5 py-1.5 text-[11px] text-ink-3">
              <span>次の解放まで</span>
              <span
                className="tabular-nums"
                style={{ color: gate.meetsAvgLevel ? "var(--positive)" : undefined }}
              >
                平均Lv {shownAvgLevel} / {GAME.UNLOCK_AVG_LEVEL.toFixed(1)}以上
              </span>
              <span
                className="tabular-nums"
                style={{ color: gate.meetsUnlearnedRatio ? "var(--positive)" : undefined }}
              >
                未正解（未出題＋Lv.1） {shownUnlearnedPct}% /{" "}
                {Math.round(GAME.UNLOCK_UNLEARNED_RATIO * 100)}%以下
              </span>
            </div>
          )}

          {message && (
            <p className="mt-2 text-xs leading-relaxed text-ink-2">{message}</p>
          )}

          {/* 解放は稀にしか起きない前進の合図。ここは操作色を使ってよい */}
          {unlockedThisRun > 0 && (
            <div className="mt-2 rounded-md border-l-2 border-accent bg-surface-2 px-2.5 py-1.5 text-xs text-accent">
              新たに {unlockedThisRun} 語がプールに追加された
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-3 pt-2 sm:px-6">
        <button
          type="button"
          onClick={onContinue}
          className="btn-accent flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm"
        >
          次のセットへ →
          {autoContinue && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15 text-xs tabular-nums">
              {secondsLeft}
            </span>
          )}
        </button>
      </div>
    </motion.div>
  );
}
