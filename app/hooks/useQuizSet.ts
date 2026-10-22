import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeAnswer } from "@/lib/answerNormalization";
import { gradeAnswer } from "@/lib/gradeAnswer";
import { canAdvanceWindow } from "@/lib/quizSet";
import { QuizEntry, VocabItem } from "@/lib/types";

interface UseQuizSetProps {
  approvedAnswers?: Record<string, string[]>;
  rejectedAnswers?: Record<string, string[]>;
  /** AIが正解と認めた回答を記憶するコールバック。次回は往復を省ける */
  onAiApproved?: (wordId: string, normalizedAnswer: string) => void;
  /** AIが不正解と判定した回答を記憶するコールバック */
  onAiRejected?: (wordId: string, normalizedAnswer: string) => void;
}

export interface PickedQuestion {
  poolIndex: number;
  item: VocabItem;
  /** 単語を見せず読み上げだけで出すか */
  audioOnly?: boolean;
}

/**
 * 10問の小テストを1セットとして扱うセッション状態。
 *
 * 1問ずつ「回答 → 採点待ち → 正誤 → 次へ」と進む代わりに、確定した回答から
 * 順に裏で採点する。採点の往復は次の設問を打つ時間と並走するので、
 * 待ち時間がコアループから消える。正誤は設問ごとに採点が返り次第見せる
 * （随時採点）。ただし前の設問の答え合わせを見ないまま次の設問が出ることは
 * ない——窓を進めてよいかは `canAdvance`（lib/quizSet.ts の
 * `canAdvanceWindow`）が判定する。
 */
export function useQuizSet({
  approvedAnswers = {},
  rejectedAnswers = {},
  onAiApproved,
  onAiRejected,
}: UseQuizSetProps) {
  const [entries, setEntries] = useState<QuizEntry[]>([]);
  /** セットを組み直すたびに増える。初期フォーカスなどの起点に使う */
  const [setId, setSetId] = useState<number>(0);

  // 非同期の採点結果が返ってきた時点の最新状態を同期的に読むための鏡。
  // 採点はユーザーの入力と並走するので、setState の反映を待てない。
  const entriesRef = useRef<QuizEntry[]>([]);
  /** 設問ごとの採点リクエスト番号。打ち直されたら古い結果を捨てる */
  const requestIdsRef = useRef<number[]>([]);

  // 採点は入力と並走するので、commit を作り直さずに最新の記憶キャッシュと
  // コールバックへ届くようにしておく。
  const latest = useRef({ approvedAnswers, rejectedAnswers, onAiApproved, onAiRejected });
  useEffect(() => {
    latest.current = { approvedAnswers, rejectedAnswers, onAiApproved, onAiRejected };
  }, [approvedAnswers, rejectedAnswers, onAiApproved, onAiRejected]);

  const apply = useCallback((updater: (prev: QuizEntry[]) => QuizEntry[]) => {
    const next = updater(entriesRef.current);
    if (next === entriesRef.current) return;
    entriesRef.current = next;
    setEntries(next);
  }, []);

  /** 新しい10問でセットを組み直す */
  const startSet = useCallback((picked: PickedQuestion[]) => {
    // 飛んでいる採点が新しいセットの設問に紛れ込まないよう番号を進める
    requestIdsRef.current = picked.map((_, slot) => (requestIdsRef.current[slot] ?? 0) + 1);
    const next = picked.map(({ poolIndex, item, audioOnly }) => ({
      poolIndex,
      item,
      input: "",
      committed: false,
      outcome: null,
      ...(audioOnly ? { audioOnly: true } : {}),
    }));
    entriesRef.current = next;
    setEntries(next);
    setSetId((id) => id + 1);
  }, []);

  /**
   * 回答欄に初めてカーソルが入った時刻を記録する（想起時間の起点）。
   * 戻って開き直しても最初の時刻のまま。描画には影響しないので鏡だけ書き換え、
   * 再描画は起こさない（次の setState で一緒に反映される）。
   */
  const markShown = useCallback((slot: number) => {
    const entry = entriesRef.current[slot];
    if (!entry || entry.shownAt !== undefined) return;
    const next = [...entriesRef.current];
    next[slot] = { ...entry, shownAt: Date.now() };
    entriesRef.current = next;
  }, []);

  const setInput = useCallback((slot: number, value: string) => {
    const entry = entriesRef.current[slot];
    if (!entry || entry.input === value) return;
    // 打ち直したら、その設問について飛んでいる採点の結果は捨てる
    requestIdsRef.current[slot] = (requestIdsRef.current[slot] ?? 0) + 1;
    // 最初の1文字を打った時点で想起時間を確定する
    const recallMs =
      entry.recallMs === undefined && entry.shownAt !== undefined && value.length > 0
        ? Date.now() - entry.shownAt
        : entry.recallMs;
    apply((prev) => {
      const next = [...prev];
      next[slot] = { ...prev[slot], input: value, committed: false, outcome: null, recallMs };
      return next;
    });
  }, [apply]);

  /**
   * 回答を確定し、採点を裏で走らせる。呼び出し側は結果を待たない。
   * 確定済みの設問を確定し直すことはない（同じ回答を二度採点しない）。
   */
  const commit = useCallback((slot: number) => {
    const entry = entriesRef.current[slot];
    if (!entry || entry.committed) return;

    const requestId = (requestIdsRef.current[slot] ?? 0) + 1;
    requestIdsRef.current[slot] = requestId;

    apply((prev) => {
      const next = [...prev];
      next[slot] = { ...prev[slot], committed: true, outcome: null };
      return next;
    });

    const { approvedAnswers: approved, rejectedAnswers: rejected } = latest.current;
    void gradeAnswer({
      item: entry.item,
      answerText: entry.input,
      approvedAnswers: approved,
      rejectedAnswers: rejected,
    }).then((outcome) => {
      // 打ち直された／セットが組み直された設問の結果は捨てる
      if (requestIdsRef.current[slot] !== requestId) return;

      const user = normalizeAnswer(entry.input);
      if (user && outcome.status === "ai_approved") {
        latest.current.onAiApproved?.(entry.item.id, user);
      }
      // aiScore が付いているのはAIが実際に判定を返したときだけ
      // （レート制限・未設定・タイムアウト時は付かない）
      if (user && outcome.status === "wrong" && typeof outcome.aiScore === "number") {
        latest.current.onAiRejected?.(entry.item.id, user);
      }

      apply((prev) => {
        const current = prev[slot];
        if (!current?.committed) return prev;
        const next = [...prev];
        next[slot] = { ...current, outcome };
        return next;
      });
    });
  }, [apply]);

  /**
   * commit 直後にも使えるよう、state ではなく鏡から窓を進めてよいかを読む。
   * ユーザー操作の中（Enter・確定ボタン）で同期的に判定してこそ、進んだ先の
   * 入力欄へ同じ操作の中でフォーカスでき、スマホのキーボードが閉じない。
   */
  const canAdvance = useCallback(
    (windowStart: number) => canAdvanceWindow(entriesRef.current, windowStart),
    [],
  );

  const answeredCount = useMemo(
    () => entries.filter((e) => e.committed).length,
    [entries],
  );
  const allCommitted = entries.length > 0 && answeredCount === entries.length;
  const allGraded =
    allCommitted && entries.every((e) => e.outcome !== null);

  return {
    entries,
    setId,
    startSet,
    markShown,
    setInput,
    commit,
    canAdvance,
    answeredCount,
    allCommitted,
    allGraded,
  };
}
