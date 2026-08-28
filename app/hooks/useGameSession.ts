import { useState, useCallback, useMemo } from "react";
import { normalizeAnswer } from "@/lib/answerNormalization";
import { VocabItem, WordStat, SessionAnswer, GameView } from "@/lib/types";
import { applyAnswerToStat } from "@/lib/reviewSchedule";

interface UseGameSessionProps {
  q: VocabItem | undefined;
  index: number;
  activeView: GameView;
  stats: WordStat[];
  setStats: React.Dispatch<React.SetStateAction<WordStat[]>>;
  approvedAnswers?: Record<string, string[]>;
  rejectedAnswers?: Record<string, string[]>;
  /**
   * AIが正解と認めた回答を記憶するためのコールバック。
   * 同じ単語に同じ回答をした次回は、APIもAIも呼ばずに正解にできる。
   */
  onAiApproved?: (wordId: string, normalizedAnswer: string) => void;
  /**
   * AIが不正解と判定した回答を記憶するためのコールバック。
   * 同じ単語に同じ誤答をした次回は、APIもAIも呼ばずに即座に不正解にできる。
   */
  onAiRejected?: (wordId: string, normalizedAnswer: string) => void;
}

export function useGameSession({
  q,
  index,
  activeView,
  stats,
  setStats,
  approvedAnswers = {},
  rejectedAnswers = {},
  onAiApproved,
  onAiRejected,
}: UseGameSessionProps) {
  const [score, setScore] = useState<number>(0);
  const [total, setTotal] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([]);

  const [input, setInput] = useState<string>("");
  const [checked, setChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [answerStatus, setAnswerStatus] = useState<string | null>(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState<boolean>(false);
  const [posViolation, setPosViolation] = useState<string | null>(null);
  /** AIが不正解と判断したときの短い理由。正解時・AI未実行時は null */
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const normalizedAnswers = useMemo(
    () => (q?.answers ?? []).map(normalizeAnswer),
    [q],
  );

  /**
   * 回答を判定する。
   * @param overrideInput 選択式などで入力欄以外から回答するときの回答文字列。
   *   ボタンの onClick に直接渡されるとイベントが入ってくるため、文字列のみ採用する。
   * @param skipApi 選択式では表記ゆれ審査が不要なうえ、他の単語の訳である
   *   ダミー選択肢が「別解」として誤承認される恐れがあるため API を呼ばない。
   */
  const checkAnswer = useCallback(async (
    overrideInput?: unknown,
    { skipApi = false }: { skipApi?: boolean } = {},
  ) => {
    if (checked || isCheckingAnswer || activeView === "result" || !q) return;
    setIsCheckingAnswer(true);
    setPosViolation(null);
    setAiFeedback(null);

    const answerText = typeof overrideInput === "string" ? overrideInput : input;
    const user = normalizeAnswer(answerText);
    let result: {
      status: string;
      normalizedAnswers: string[];
      posViolation?: string | null;
      aiFeedback?: string | null;
      aiScore?: number;
    } = {
      status: normalizedAnswers.includes(user) ? "exact" : "wrong",
      normalizedAnswers,
    };

    if (result.status === "exact") {
      // 完全一致はサーバ側 evaluateAnswer でも同じ normalizeAnswer による
      // 同じ判定になるため、API 往復を挟まず即座に確定させる。
      // 正解のたびに入力欄がネットワーク待ちで固まるとフローが切れる。
    } else if (!user) {
      // 未入力（空白のみ含む）は表記ゆれ判定の余地がなく必ず不正解のため、
      // API 往復を挟まず即座に確定させる。
    } else if ((approvedAnswers[q.id] ?? []).includes(user)) {
      // 過去にAIが認めた回答。AIを呼び直さず即座に正解にする。
      result = { status: "ai_approved", normalizedAnswers };
    } else if ((rejectedAnswers[q.id] ?? []).includes(user)) {
      // 過去にAIが不正解と判定した回答と同じ。API/AIを呼び直さず即座に不正解にする。
      result = { status: "wrong", normalizedAnswers };
    } else if (!skipApi) {
      try {
        const response = await fetch("/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: answerText,
            target: q.target,
            collocation: q.collocation ?? "",
            answers: q.answers ?? [],
            partOfSpeech: q.partOfSpeech,
          }),
        });

        if (response.ok) result = await response.json();
      } catch {
        // Keep exact-match grading available if local API fails
      }
    }

    if (result.posViolation) setPosViolation(result.posViolation);
    if (result.aiFeedback) setAiFeedback(result.aiFeedback);

    // AIが認めた回答は記憶して、次回同じ回答をしたときの往復を省く。
    if (result.status === "ai_approved" && user) {
      onAiApproved?.(q.id, user);
    }

    // AIが不正解と判定した回答も記憶して、次回同じ誤答をしたときの
    // API/AI往復を省く。aiScore が付いているのはAIが実際に判定を
    // 返したときのみ（レート制限・未設定・タイムアウト時は付かない）。
    if (result.status === "wrong" && typeof result.aiScore === "number" && user) {
      onAiRejected?.(q.id, user);
    }

    const ok = result.status === "exact" || result.status === "alternative" || result.status === "ai_approved";
    const prev = stats[index] ?? { correct: 0, wrong: 0 };

    setIsCorrect(ok);
    setAnswerStatus(result.status);
    setChecked(true);
    setSessionAnswers((a) => [
      ...a,
      {
        id: q.id,
        correct: ok,
        previousCorrect: prev.correct,
        previousWrong: prev.wrong,
      },
    ]);

    // 正誤カウントに加えて分散学習の状態（最終解答時刻・連続正解数）も更新する
    setStats((prevStats) => {
      const nextStats = [...prevStats];
      nextStats[index] = applyAnswerToStat(nextStats[index], ok);
      return nextStats;
    });

    if (ok) {
      setScore((s) => s + 1);
      setStreak((st) => {
        const ns = st + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }

    setIsCheckingAnswer(false);
  }, [checked, isCheckingAnswer, activeView, q, input, normalizedAnswers, approvedAnswers, rejectedAnswers, onAiApproved, onAiRejected, stats, index, setStats]);

  /**
   * 「？」ボタン（わからない）押下時の判定。
   * 不正解時と全く同じ扱いにする（score/streak/単語ごとの正誤統計に
   * 反映）。入力欄の途中入力は判定に使わず常に不正解として扱う。
   */
  const giveUp = useCallback(() => {
    if (checked || isCheckingAnswer || activeView === "result" || !q) return;
    const prev = stats[index] ?? { correct: 0, wrong: 0 };

    setPosViolation(null);
    setAiFeedback(null);
    setIsCorrect(false);
    setAnswerStatus("skipped");
    setChecked(true);
    setInput("");
    setSessionAnswers((a) => [
      ...a,
      {
        id: q.id,
        correct: false,
        previousCorrect: prev.correct,
        previousWrong: prev.wrong,
      },
    ]);

    setStats((prevStats) => {
      const nextStats = [...prevStats];
      nextStats[index] = applyAnswerToStat(nextStats[index], false);
      return nextStats;
    });

    setStreak(0);
  }, [checked, isCheckingAnswer, activeView, q, stats, index, setStats]);

  const resetSession = useCallback(() => {
    setScore(0);
    setTotal(1);
    setStreak(0);
    setBestStreak(0);
    setSessionAnswers([]);
    setInput("");
    setChecked(false);
    setIsCorrect(false);
    setAnswerStatus(null);
    setIsCheckingAnswer(false);
    setPosViolation(null);
    setAiFeedback(null);
  }, []);

  const prepareNextQuestion = useCallback(() => {
    setInput("");
    setChecked(false);
    setIsCorrect(false);
    setAnswerStatus(null);
    setPosViolation(null);
    setAiFeedback(null);
  }, []);

  return {
    score,
    setScore,
    total,
    setTotal,
    streak,
    setStreak,
    bestStreak,
    setBestStreak,
    sessionAnswers,
    setSessionAnswers,
    input,
    setInput,
    checked,
    setChecked,
    isCorrect,
    setIsCorrect,
    answerStatus,
    setAnswerStatus,
    isCheckingAnswer,
    posViolation,
    setPosViolation,
    aiFeedback,
    checkAnswer,
    giveUp,
    resetSession,
    prepareNextQuestion,
    normalizedAnswers,
  };
}
