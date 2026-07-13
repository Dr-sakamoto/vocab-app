import { useState, useCallback, useMemo } from "react";
import { normalizeAnswer } from "@/lib/answerNormalization";
import { VocabItem, WordStat, SessionAnswer, GameView } from "@/lib/types";

interface UseGameSessionProps {
  q: VocabItem | undefined;
  index: number;
  activeView: GameView;
  stats: WordStat[];
  setStats: React.Dispatch<React.SetStateAction<WordStat[]>>;
  approvedAnswers?: Record<string, string[]>;
}

export function useGameSession({
  q,
  index,
  activeView,
  stats,
  setStats,
  approvedAnswers = {},
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

    const answerText = typeof overrideInput === "string" ? overrideInput : input;
    const user = normalizeAnswer(answerText);
    let result: { status: string; normalizedAnswers: string[]; posViolation?: string | null } = {
      status: normalizedAnswers.includes(user) ? "exact" : "wrong",
      normalizedAnswers,
    };

    if (result.status === "wrong" && (approvedAnswers[q.id] ?? []).includes(user)) {
      result = { status: "ai_approved", normalizedAnswers };
    } else if (!skipApi) {
      try {
        const response = await fetch("/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: answerText, answers: q.answers ?? [], partOfSpeech: q.partOfSpeech }),
        });

        if (response.ok) result = await response.json();
      } catch {
        // Keep exact-match grading available if local API fails
      } finally {
        setIsCheckingAnswer(false);
      }
    }

    if (result.posViolation) setPosViolation(result.posViolation);

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

    setStats((prevStats) => {
      const nextStats = [...prevStats];
      const cur = nextStats[index] ?? { correct: 0, wrong: 0 };
      nextStats[index] = ok
        ? { correct: cur.correct + 1, wrong: cur.wrong }
        : { correct: cur.correct, wrong: cur.wrong + 1 };
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
  }, [checked, isCheckingAnswer, activeView, q, input, normalizedAnswers, approvedAnswers, stats, index, setStats]);

  /**
   * 「？」ボタン（わからない）押下時の判定。
   * 不正解時と全く同じ扱いにする（score/streak/単語ごとの正誤統計・
   * バトルのダメージ/捕獲判定に反映）。入力欄の途中入力は判定に使わず
   * 常に不正解として扱う。
   */
  const giveUp = useCallback(() => {
    if (checked || isCheckingAnswer || activeView === "result" || !q) return;
    const prev = stats[index] ?? { correct: 0, wrong: 0 };

    setPosViolation(null);
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
      const cur = nextStats[index] ?? { correct: 0, wrong: 0 };
      nextStats[index] = { correct: cur.correct, wrong: cur.wrong + 1 };
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
  }, []);

  const prepareNextQuestion = useCallback(() => {
    setInput("");
    setChecked(false);
    setIsCorrect(false);
    setAnswerStatus(null);
    setPosViolation(null);
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
    checkAnswer,
    giveUp,
    resetSession,
    prepareNextQuestion,
    normalizedAnswers,
  };
}
