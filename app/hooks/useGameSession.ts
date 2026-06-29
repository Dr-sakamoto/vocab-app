import { useState, useCallback, useMemo } from "react";
import { normalizeAnswer } from "@/lib/answerNormalization";
import { VocabItem, WordStat, SessionAnswer, GameView } from "@/lib/types";

interface UseGameSessionProps {
  q: VocabItem | undefined;
  index: number;
  activeView: GameView;
  stats: WordStat[];
  setStats: React.Dispatch<React.SetStateAction<WordStat[]>>;
}

export function useGameSession({
  q,
  index,
  activeView,
  stats,
  setStats,
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

  const normalizedAnswers = useMemo(
    () => (q?.answers ?? []).map(normalizeAnswer),
    [q],
  );

  const checkAnswer = useCallback(async () => {
    if (checked || isCheckingAnswer || activeView === "result" || !q) return;
    setIsCheckingAnswer(true);

    const user = normalizeAnswer(input);
    let result = {
      status: normalizedAnswers.includes(user) ? "exact" : "wrong",
      normalizedAnswers,
    };

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, answers: q.answers ?? [] }),
      });

      if (response.ok) {
        result = await response.json();
      }
    } catch {
      // Keep exact-match grading available if local API fails
    } finally {
      setIsCheckingAnswer(false);
    }

    const ok = result.status === "exact" || result.status === "alternative";
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
  }, [checked, isCheckingAnswer, activeView, q, input, normalizedAnswers, stats, index, setStats]);

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
  }, []);

  const prepareNextQuestion = useCallback(() => {
    setInput("");
    setChecked(false);
    setIsCorrect(false);
    setAnswerStatus(null);
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
    checkAnswer,
    resetSession,
    prepareNextQuestion,
    normalizedAnswers,
  };
}
