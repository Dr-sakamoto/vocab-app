"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import RetentionRing from "./game/RetentionRing";
import { RETENTION_LEVELS } from "@/lib/retention";
import { evaluateUnlockGate, unlockProgress } from "@/lib/unlockGate";
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
  /**
   * 周回出題（lib/lapOrder.ts）のセットだったときの進み具合。
   * 周回中は解放ゲートを使っていないので、「次の解放まで」の代わりにこれを出す。
   */
  lap?: {
    /** 完了した周回数 */
    completedLaps: number;
    /** 苦手パーソナライズを止めておく周回数 */
    lockCount: number;
    /** いまの周の何語目まで出し終えたか */
    cursor: number;
  };
}

interface InlineResultProps {
  evaluation: PlayEvaluation | null;
  score: number;
  playLimit: number;
  unlockedThisRun: number;
  retention: RetentionSummary;
  /**
   * 誤答した問題だけの答案（正誤つき）。定着ドーナツより後ろ、
   * スクロール領域の下側に置く。全問正解なら何も渡らない。
   */
  answerSheet?: ReactNode;
  /**
   * 自動で次のセットへ流すか。読むべき誤答があるときは false にして、
   * 復習の途中で画面が切り替わらないようにする。
   */
  autoContinue?: boolean;
  /** このセットでちょうど今日の目標セット数に届いたか */
  goalJustReached?: boolean;
  /** 今日解き終えたセット数（このセットを含む）と目標セット数 */
  todaySets?: number;
  dailyGoal?: number;
  onContinue: () => void;
  /** このセットで落とした語数。0 なら復習の導線を出さない */
  mistakeCount?: number;
  /** 落とした語だけを苦手フラッシュで流す */
  onReviewMistakes?: () => void;
}

/**
 * 10問の小テストが終わったところで、問題ウィンドウの中身と入れ替わる結果発表。
 * ページ遷移せず、評価と誤答した問題だけをその場で見せる。
 *
 * 「次のセットへ」は常に最上部に固定し、評価（ドーナツ）→誤答した問題の順に
 * その下をスクロールする。誤答だけを残すのは、正解した問題を読み返す必要が
 * 無いため（このセットで学べるものは「どの語を落としたか」）。
 *
 * 誤答が無ければ自動で次のセットへ流す（読むものが無いので止める理由がない）。
 * 誤答があるときは自動送りを止める。ここが「どの語を落としたか」を読む場で、
 * 読んでいる最中に画面が切り替わるほうが割り込みになる。
 *
 * 出てから GAME.RESULT_CONTINUE_LOCK_MS のあいだ、「次のセットへ」は
 * disabled にしておく。10問を送り続けた勢いで余った1打（スマホでは
 * キーボードが閉じたあとのゴーストクリック）がここに届いて、結果を
 * 一瞬も読めないまま次のセットへ飛ぶのを防ぐ。押せない状態を色でも示すのは
 * 回答欄の送信ボタンと同じ扱い（押せるようになって初めて操作色になる）で、
 * 弾かれたことが見えないまま無反応になるのを避けるため。
 */
export default function InlineResult({
  evaluation,
  score,
  playLimit,
  unlockedThisRun,
  retention,
  answerSheet,
  autoContinue = true,
  goalJustReached = false,
  todaySets = 0,
  dailyGoal = 0,
  onContinue,
  mistakeCount = 0,
  onReviewMistakes,
}: InlineResultProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CONTINUE_SECONDS);
  /** 出た直後に届く「余りの1打」を受け付けないための錠。時間で自動的に開く */
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setLocked(false),
      GAME.RESULT_CONTINUE_LOCK_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

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

  /**
   * まれにしか起きない前進（全問正解・プールの解放）だけは、結果発表の
   * 区切りで大きく祝う。いつ来るか分からないごほうびが没入を支える。
   * 毎回出すと意味が薄れるので、それ以外のセットでは何も足さない。
   */
  const celebrate = score === playLimit || unlockedThisRun > 0;

  const { retained, poolSize, gain, levelCounts, totalWords, lap } = retention;

  // 解放の条件はプール全体の分布で決まる（このセットの正答率では決まらない）。
  // 何が足りていないのかを出しておかないと、解放の有無が偶然に見えてしまう。
  const gate = evaluateUnlockGate(levelCounts);
  // 表示は必ず条件と同じ向きへ丸める。平均Lvは切り捨て、未正解の割合は
  // 切り上げ。四捨五入だと「2.0 と出ているのに解放されない」（実際は1.96）が
  // 起きて、数字が条件を説明できなくなる。
  const shownAvgLevel = (Math.floor(gate.avgLevel * 10) / 10).toFixed(1);
  const shownUnlearnedPct = Math.ceil(gate.unlearnedRatio * 100);

  // 結果発表のゲージは1本だけ。周回中は周回の進み、そのあとは次の解放までの進み
  const gauge: { label: string; note: string; value: number } | null = lap
    ? lap.completedLaps >= lap.lockCount
      ? {
          label: `${lap.lockCount} 周完了`,
          note: "次のセットから苦手に合わせた出題",
          value: 1,
        }
      : lap.cursor === 0 && lap.completedLaps > 0
        ? {
            label: `${lap.completedLaps} 周目を完走`,
            note: `残り ${lap.lockCount - lap.completedLaps} 周`,
            value: 1,
          }
        : {
            label: `周回 ${lap.completedLaps + 1} / ${lap.lockCount} 周目`,
            note: `${lap.cursor.toLocaleString()} / ${totalWords.toLocaleString()} 語`,
            value: totalWords > 0 ? lap.cursor / totalWords : 0,
          }
    : poolSize > 0 && poolSize < totalWords
      ? {
          label: "次の解放まで",
          note: gate.step > 0 ? "解放" : `${Math.floor(unlockProgress(gate) * 100)}%`,
          value: unlockProgress(gate),
        }
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="shrink-0 px-4 pt-3 pb-2 sm:px-6">
        <button
          type="button"
          onClick={onContinue}
          disabled={locked}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm ${
            locked ? "btn-quiet" : "btn-accent"
          }`}
        >
          次のセットへ →
          {autoContinue && (
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${
                locked ? "bg-surface-2" : "bg-black/15"
              }`}
            >
              {secondsLeft}
            </span>
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 sm:px-6">
        {/* 今日のゴールに届いた瞬間だけ大きく見せる。ここで終えてもいい、
            という区切りにもなる（続けるかどうかは本人が決める） */}
        {goalJustReached ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="mb-3 rounded-lg border border-positive bg-surface-2 px-3 py-2.5 text-center"
          >
            <div className="text-base text-positive">今日の目標達成</div>
            <div className="mt-0.5 text-xs text-ink-2">
              {dailyGoal} セット完了。ここで終えても、続けてもいい
            </div>
          </motion.div>
        ) : (
          dailyGoal > 0 &&
          todaySets < dailyGoal && (
            <div className="mb-2 text-center text-xs tabular-nums text-ink-3">
              今日の目標まであと {dailyGoal - todaySets} セット
            </div>
          )
        )}
        <div className="prompt-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="relative inline-block">
                {celebrate && <Burst />}
                <motion.span
                  initial={celebrate ? { opacity: 0, scale: 0.4 } : { opacity: 0, y: 4 }}
                  animate={celebrate ? { opacity: 1, scale: [0.4, 1.35, 1] } : { opacity: 1, y: 0 }}
                  transition={
                    celebrate
                      ? { duration: 0.6, ease: "easeOut", delay: 0.15 }
                      : { duration: 0.2, ease: "easeOut", delay: 0.1 }
                  }
                  className={`relative inline-block text-3xl ${celebrate ? "text-positive" : "text-ink-1"}`}
                >
                  {grade}
                </motion.span>
              </span>
              <span className="text-sm text-ink-2">{title}</span>
            </div>
            <div className="text-sm tabular-nums text-ink-3">
              {score} / {playLimit} 正解
            </div>
          </div>

          {/* 一目で読む層は3つだけ：評価・このセットで増えた定着語・次の解放
              までのゲージ。凡例や条件の内訳は「くわしく」に畳む。10問ごとに
              必ず通る画面なので、読む量がそのままテンポの重さになる。 */}
          <div className="mt-2 flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2">
            <RetentionRing levelCounts={levelCounts} poolSize={poolSize} />
            <div className="min-w-0">
              {/* 割合は解放で分母が増えると下がりうるので、実数の増減を主役にする */}
              <div
                className="tabular-nums text-base"
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
              <div className="tabular-nums text-xs text-ink-3">
                定着 {retained.toLocaleString()} / 出題プール{" "}
                {poolSize.toLocaleString()} 語
              </div>
            </div>
          </div>

          {gauge && (
            <div className="mt-2 px-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-ink-2">{gauge.label}</span>
                <span className="tabular-nums text-ink-3">{gauge.note}</span>
              </div>
              <div
                className="gauge-track mt-1 h-1.5 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-label={gauge.label}
                aria-valuenow={Math.round(gauge.value * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${gauge.value * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                />
              </div>
            </div>
          )}

          {/* 解放は稀にしか起きない前進の合図。ここは操作色を使ってよい */}
          {unlockedThisRun > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
              className="mt-2 rounded-md border border-accent bg-surface-2 px-3 py-2.5 text-center"
            >
              <div className="text-base text-accent">新しい語が解放された</div>
              <div className="mt-0.5 text-xs tabular-nums text-ink-2">
                +{unlockedThisRun} 語がプールに追加
              </div>
            </motion.div>
          )}

          {message && (
            <p className="mt-2 text-xs leading-relaxed text-ink-2">{message}</p>
          )}

          <details className="mt-2 px-1 text-[11px] text-ink-3">
            <summary className="cursor-pointer select-none py-1">くわしく</summary>
            {/* ドーナツの色分けが何を指しているかを、実数つきの凡例として文字でも出す。
                色の意味を色だけに頼らせない（判定色の凡例と同じ考え方）。 */}
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {RETENTION_LEVELS.map(({ level, label, color }) => (
                <div key={level} className="flex items-center gap-1">
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
                新しい指標を覚えなくても対応が付く。ゲージはこの2つのうち
                足りていないほうで止まる。 */}
            {!lap && poolSize > 0 && poolSize < totalWords && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span>次の解放の条件</span>
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
            {lap && (
              <div className="mt-2">
                最初の {lap.lockCount} 周は全語を順に流し、苦手に合わせた出題はそのあとに切り替わる
              </div>
            )}
          </details>
        </div>

        {/* 誤答を読んで自分で次へ押す代わりに、落とした語を自動送りで
            眺めて復習できるようにする（押すのは1回だけ） */}
        {mistakeCount > 0 && onReviewMistakes && (
          <button
            type="button"
            onClick={onReviewMistakes}
            className="btn-quiet mt-3 flex h-11 w-full items-center justify-center rounded-lg text-sm"
          >
            落とした {mistakeCount} 語をフラッシュで流す
          </button>
        )}

        {answerSheet && <div className="mt-4">{answerSheet}</div>}
      </div>
    </motion.div>
  );
}

/** 評価の文字から放射状に散る粒。色はトークン（正解色と操作色）だけを使う */
function Burst() {
  const count = 12;
  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 34 + (i % 3) * 8;
        return (
          <motion.span
            key={i}
            className={`absolute h-1.5 w-1.5 rounded-full ${i % 2 ? "bg-accent" : "bg-positive"}`}
            style={{ left: -3, top: -3 }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.6],
            }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
          />
        );
      })}
    </span>
  );
}
