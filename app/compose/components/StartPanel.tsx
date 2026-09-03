"use client";

import Link from "next/link";
import { COMPOSE } from "@/lib/compose/constants";
import { buildTagProgressRows, getWeakTagIds } from "@/lib/compose/mastery";
import { summarizeProgress } from "@/lib/compose/progress";
import type { ComposeMode, ComposeProgress, ComposeSettings } from "@/lib/compose/types";
import MasteryBar from "./MasteryBar";

interface StartPanelProps {
  progress: ComposeProgress;
  settings: ComposeSettings;
  onStart: (mode: ComposeMode) => void;
  onSettingsChange: (next: Partial<ComposeSettings>) => void;
}

/**
 * セッションを始める前の画面。
 *
 * ここでしか意思決定をさせない。始めたあとは「書く」以外の選択肢を
 * 画面から消す（モード・問題数・ヒントの有無は全部ここで決まる）。
 *
 * 弱点を先に見せるのは、今日やることの理由をアプリの側から出すため。
 * 「何をやろうか」を毎回ユーザーに考えさせると、その一手間で開かなく
 * なる日が出る。
 */
export default function StartPanel({
  progress,
  settings,
  onStart,
  onSettingsChange,
}: StartPanelProps) {
  const summary = summarizeProgress(progress);
  const rows = buildTagProgressRows(progress);
  const weakRows = rows.filter((row) => !row.untouched).slice(0, COMPOSE.WEAK_TAG_DISPLAY);
  const hasWeakTags = getWeakTagIds(progress).length > 0;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="prompt-card p-4">
        <h1 className="text-lg text-ink-1">今日の英作文</h1>
        <p className="mt-1 text-xs text-ink-3">
          日本語を見て英文を書く。採点はAIが裏で走るので、書き終えたらすぐ次の問題へ進めます。
        </p>

        {summary.totalAttempts > 0 ? (
          <div className="mt-4 flex items-baseline gap-4 text-xs text-ink-3">
            <span className="tabular-nums">
              通算 <span className="text-ink-1">{summary.totalAttempts}</span> 問
            </span>
            <span className="tabular-nums">
              平均 <span className="text-ink-1">{summary.averageScore}</span> 点
            </span>
            <span className="tabular-nums">
              直近の合格率 <span className="text-ink-1">{summary.passRate}</span>%
            </span>
          </div>
        ) : (
          <p className="mt-4 text-xs text-ink-3">
            まず5問書いてみてください。どの文法でつまずくかが見え始めます。
          </p>
        )}

        {weakRows.length > 0 && (
          <div className="mt-4 space-y-2.5">
            <div className="text-xs text-ink-3">いま弱いところ</div>
            {weakRows.map((row) => (
              <MasteryBar
                key={row.tag.id}
                label={row.tag.label}
                mastery={row.mastery}
                attempts={row.stat.attempts}
              />
            ))}
          </div>
        )}
      </div>

      <div className="prompt-card mt-3 p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-ink-3">
          <span>1セットの問題数</span>
          <div className="flex gap-0.5 rounded-full border border-line bg-surface-1 p-0.5">
            {COMPOSE.SET_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSettingsChange({ setSize: size })}
                aria-pressed={settings.setSize === size}
                className={`min-h-8 rounded-full px-3 py-1.5 tabular-nums transition ${
                  settings.setSize === size ? "bg-line text-ink-1" : "text-ink-3 hover:text-ink-2"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-ink-3">
          <span>
            狙いの文法を最初から見せる
            <span className="ml-2 text-ink-3">ヒントあり＝負荷は下がる</span>
          </span>
          <button
            type="button"
            onClick={() => onSettingsChange({ showHints: !settings.showHints })}
            aria-pressed={settings.showHints}
            className={`min-h-8 rounded-full border px-3 py-1.5 transition ${
              settings.showHints
                ? "border-accent text-accent"
                : "border-line text-ink-3 hover:text-ink-2"
            }`}
          >
            {settings.showHints ? "見せる" : "隠す"}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={() => onStart("compose")}
          className="btn-accent min-h-12 w-full rounded-xl px-5 py-3 text-base"
        >
          英作文をはじめる（{settings.setSize}問）
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onStart("weakness")}
            disabled={!hasWeakTags}
            className="btn-quiet min-h-11 flex-1 rounded-xl px-4 py-2.5 text-sm disabled:opacity-40"
          >
            弱点特訓
          </button>
          <button
            type="button"
            onClick={() => onStart("translate")}
            className="btn-quiet min-h-11 flex-1 rounded-xl px-4 py-2.5 text-sm"
          >
            英文和訳
          </button>
        </div>
        {!hasWeakTags && (
          <p className="text-center text-[11px] text-ink-3">
            弱点特訓は、弱いところが見えてから開きます
          </p>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link href="/compose/analysis" className="text-xs text-ink-3 underline-offset-4 hover:text-ink-2 hover:underline">
          これまでの分析を見る
        </Link>
      </div>
    </div>
  );
}
