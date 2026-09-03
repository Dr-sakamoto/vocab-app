"use client";

import { useCallback, useMemo, useState } from "react";
import storage from "@/lib/storage";
import { COMPOSE, COMPOSE_STORAGE_KEYS } from "@/lib/compose/constants";
import { gradeComposition } from "@/lib/compose/gradeComposition";
import {
  DEFAULT_SETTINGS,
  EMPTY_PROGRESS,
  applyAttemptToProgress,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
} from "@/lib/compose/progress";
import { getQuestionText } from "@/lib/compose/question";
import { pickSession } from "@/lib/compose/selection";
import { evaluateSession, type SessionEvaluation } from "@/lib/compose/sessionEvaluation";
import type {
  ComposeAttempt,
  ComposeDirection,
  ComposeMode,
  ComposePrompt,
  ComposeProgress,
  ComposeSettings,
  CompositionGrade,
} from "@/lib/compose/types";
import {
  EMPTY_STREAK,
  getDisplayStreak,
  normalizeStreak,
  recordPlay,
  toDateKey,
  type StreakState,
} from "@/lib/streak";
import { useIsClient } from "./useIsClient";

/**
 * 英作文セッションの状態。
 *
 *   start   … 何をやるか決める（弱点の確認とモード選択）
 *   writing … 出題。1問書いて確定するとすぐ次の問題へ進む
 *   review  … 講評。1問ずつ添削を読む
 *   summary … セッション全体の伸び
 *
 * writing と review を分けているのが、このアプリの設計の要。
 * 英作文のAI採点は1件10秒前後かかる。書くたびに待たせると、5問の
 * セッションで1分近くが待ち時間になり、しかも待つたびに集中が切れる。
 * 確定した答案は裏で採点に回し、学習者は次の問題を書く（単語アプリの
 * 小テストと同じ考え方）。読むのは全部書き終えてからまとめて——
 * こちらは単語と違って1問1問の添削が学習の本体なので、読む時間は
 * 削らずに専用のフェーズとして取る。
 */
export type ComposePhase = "start" | "writing" | "review" | "summary";

export interface SessionEntry {
  prompt: ComposePrompt;
  input: string;
  committed: boolean;
  hintUsed: boolean;
  /** 採点結果。裏で走っている間は null */
  grade: CompositionGrade | null;
  /** 学習状態へ畳み込んだ答案。採点が返ってから作られる */
  attempt: ComposeAttempt | null;
}

function buildAttempt(
  entry: SessionEntry,
  direction: ComposeDirection,
  input: string,
  grade: CompositionGrade,
  answeredAt: number,
): ComposeAttempt {
  return {
    promptId: entry.prompt.id,
    direction,
    question: getQuestionText(entry.prompt, direction),
    input,
    answers: [...entry.prompt.answers],
    tags: [...entry.prompt.tags],
    score: grade.score,
    verdict: grade.verdict,
    corrected: grade.corrected,
    feedback: grade.feedback,
    good: grade.good,
    tagJudgements: grade.tags,
    hintUsed: entry.hintUsed,
    answeredAt,
  };
}

export function useComposeSession() {
  // 保存済みの状態は、ハイドレーションが済んでから読み込む（useIsClient）。
  // 読み込んだ値はそのまま「初期値」として使い、以後の更新だけを
  // override 側の state で持つ。こうすると、保存の読み込みのために
  // effect で setState する必要がなくなる。
  const isClient = useIsClient();

  const initialProgress = useMemo<ComposeProgress>(
    () => (isClient ? loadProgress() : EMPTY_PROGRESS),
    [isClient],
  );
  const initialSettings = useMemo<ComposeSettings>(
    () => (isClient ? loadSettings() : DEFAULT_SETTINGS),
    [isClient],
  );
  const initialStreak = useMemo<StreakState>(
    () =>
      isClient
        ? normalizeStreak(storage.get<unknown>(COMPOSE_STORAGE_KEYS.STREAK, null))
        : EMPTY_STREAK,
    [isClient],
  );

  const [progressOverride, setProgressOverride] = useState<ComposeProgress | null>(null);
  const [settingsOverride, setSettingsOverride] = useState<ComposeSettings | null>(null);
  const [streakOverride, setStreakOverride] = useState<StreakState | null>(null);

  const progress = progressOverride ?? initialProgress;
  const settings = settingsOverride ?? initialSettings;
  const streak = streakOverride ?? initialStreak;

  const [phase, setPhase] = useState<ComposePhase>("start");
  const [mode, setMode] = useState<ComposeMode>("compose");
  const [entries, setEntries] = useState<SessionEntry[]>([]);
  const [writingIndex, setWritingIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [evaluation, setEvaluation] = useState<SessionEvaluation | null>(null);
  /** セッション開始時点の学習状態。講評で「どれだけ動いたか」を出すのに使う */
  const [progressBefore, setProgressBefore] = useState<ComposeProgress>(EMPTY_PROGRESS);

  const direction: ComposeDirection = mode === "translate" ? "en-to-ja" : "ja-to-en";

  const updateSettings = useCallback(
    (next: Partial<ComposeSettings>) => {
      const merged = { ...settings, ...next };
      saveSettings(merged);
      setSettingsOverride(merged);
    },
    [settings],
  );

  const startSession = useCallback(
    (nextMode: ComposeMode) => {
      const prompts = pickSession({
        progress,
        mode: nextMode,
        setSize: settings.setSize,
      });
      if (prompts.length === 0) return;

      setProgressBefore(progress);
      setMode(nextMode);
      setEntries(
        prompts.map((prompt) => ({
          prompt,
          input: "",
          committed: false,
          hintUsed: settings.showHints,
          grade: null,
          attempt: null,
        })),
      );
      setWritingIndex(0);
      setReviewIndex(0);
      setEvaluation(null);
      setPhase("writing");

      // 学習した日として記録するのはセッションを始めた時点。
      // 最後まで解かないと連続が途切れる設計にすると、時間が無い日ほど
      // 「どうせ途切れるならやらない」に倒れる。
      const next = recordPlay(streak, toDateKey(new Date()));
      storage.set(COMPOSE_STORAGE_KEYS.STREAK, next);
      setStreakOverride(next);
    },
    [progress, settings.setSize, settings.showHints, streak],
  );

  /** ヒント（狙いのタグと書き方の指針）を開いた。採点には影響しないが記録は残す */
  const revealHint = useCallback((index: number) => {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, hintUsed: true } : entry)),
    );
  }, []);

  /**
   * 答案を確定する。採点は待たずに次の問題へ進む。
   * 返ってきた採点はその場で学習状態へ畳み込み、講評フェーズで読ませる。
   */
  const commitAnswer = useCallback(
    (index: number, text: string) => {
      const entry = entries[index];
      if (!entry || entry.committed) return;

      setEntries((prev) =>
        prev.map((item, i) => (i === index ? { ...item, input: text, committed: true } : item)),
      );

      void gradeComposition({ prompt: entry.prompt, input: text, direction }).then((grade) => {
        const attempt = buildAttempt(entry, direction, text, grade, Date.now());

        setEntries((prev) =>
          prev.map((item, i) => (i === index ? { ...item, grade, attempt } : item)),
        );
        // 採点は並走しているので、複数の結果が相前後して返る。
        // 直前の値から積み上げる更新にして、取りこぼしを作らない。
        setProgressOverride((prev) => {
          const next = applyAttemptToProgress(prev ?? initialProgress, attempt);
          saveProgress(next);
          return next;
        });
      });

      if (index + 1 < entries.length) setWritingIndex(index + 1);
      else setPhase("review");
    },
    [direction, entries, initialProgress],
  );

  /** 講評を1問進める。最後まで読んだらセッションの総括へ */
  const advanceReview = useCallback(() => {
    if (reviewIndex + 1 < entries.length) {
      setReviewIndex(reviewIndex + 1);
      return;
    }

    const attempts = entries
      .map((entry) => entry.attempt)
      .filter((attempt): attempt is ComposeAttempt => attempt !== null);

    setEvaluation(
      evaluateSession({
        attempts,
        before: progressBefore,
        after: progress,
        streakDays: getDisplayStreak(streak, toDateKey(new Date())),
      }),
    );
    setPhase("summary");
  }, [entries, progress, progressBefore, reviewIndex, streak]);

  const backToStart = useCallback(() => {
    setPhase("start");
    setEntries([]);
    setWritingIndex(0);
    setReviewIndex(0);
  }, []);

  const streakDays = getDisplayStreak(streak, toDateKey(new Date()));

  /** 採点が返ってきた件数（講評フェーズの待ち表示に使う） */
  const gradedCount = entries.filter((entry) => entry.grade !== null).length;

  return {
    isLoaded: isClient,
    phase,
    mode,
    direction,
    entries,
    writingIndex,
    reviewIndex,
    gradedCount,
    progress,
    settings,
    streakDays,
    evaluation,
    setSize: settings.setSize,
    passScore: COMPOSE.PASS_SCORE,
    startSession,
    commitAnswer,
    revealHint,
    advanceReview,
    backToStart,
    updateSettings,
  };
}
