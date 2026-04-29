"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProgressDashboard from "./components/ProgressDashboard";
import ResultScreen from "./components/ResultScreen";

import { QUESTIONS } from "@/lib/vocab";

/** 各問題に安定した ID（localStorage で「単語単位」を識別するため） */
const VOCAB_ITEMS = QUESTIONS.map((q, i) => ({
  ...q,
  id: `w${i}`,
}));

const STORAGE_KEY = "vocab-progress";
const POOL_STORAGE_KEY = "vocab-active-pool-size";

const INITIAL_POOL_SIZE = 60;
const UNLOCK_ACCURACY = 0.8;
const UNLOCK_STEP = 30;
const PERFECT_UNLOCK_STEP = 50;

function getPartOfSpeech(q) {
  return q?.partOfSpeech ?? "word";
}

function normalizeAnswer(value) {
  return String(value ?? "")
    .normalize("NFKC") // 全角/半角などを寄せる
    .replace(/[\u007E\uFF5E\u301C\u223C]/g, "〜") // 波ダッシュは統一
    .trim() // 要件: 空白除去
    .replace(/\s+/g, "") // 余分な空白ゆれ吸収（"悪 影響 のある" など）
    .toLowerCase(); // 英字が混ざっても大小ゆれ吸収
}

function getPraiseMessage(streak) {
  if (streak >= 9 && streak <= 10) {
    return { label: "MARVELOUS!!!", color: "text-red-600" };
  }
  if (streak >= 7 && streak <= 8) {
    return { label: "AMAZING!!", color: "text-violet-600" };
  }
  if (streak >= 5 && streak <= 6) {
    return { label: "EXCELLENT!", color: "text-blue-600" };
  }
  if (streak >= 3 && streak <= 4) {
    return { label: "GOOD", color: "text-sky-400" };
  }
  return null;
}

function pickRandomIndex(indices) {
  return indices[Math.floor(Math.random() * indices.length)];
}

function getAttempts(stat) {
  return (stat?.correct ?? 0) + (stat?.wrong ?? 0);
}

function weightedPickIndex(indices, getWeight) {
  const weighted = indices.map((i) => ({
    index: i,
    weight: Math.max(0.01, getWeight(i)),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;

  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.index;
  }

  return weighted.at(-1)?.index ?? null;
}

function getQuestionWeight(stat, currentAccuracy) {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  const attempts = correct + wrong;

  if (attempts === 0) {
    return currentAccuracy < 0.65 ? 0.25 : 1.8;
  }

  const weakness = wrong / (correct + 1);
  const confidenceBooster = correct >= 2 && wrong === 0 ? 0.45 : 1;
  const recoveryBoost = wrong > 0 ? 2.2 + weakness * 3 : 0;
  const stillLearningBoost = Math.max(0, 3 - correct) * 0.35;

  return (1 + recoveryBoost + stillLearningBoost) * confidenceBooster;
}

function getUnlockStep(score, playLimit) {
  const accuracy = score / playLimit;
  if (accuracy >= 1) return PERFECT_UNLOCK_STEP;
  if (accuracy >= UNLOCK_ACCURACY) return UNLOCK_STEP;
  return 0;
}

export default function Page() {
  // 出題設定
  const PLAY_LIMIT = 10;

  /** start = スタート画面 / study = クイズ画面 / dashboard = 進捗 */
  const [activeView, setActiveView] = useState("start");

  // 問題別の正誤（VOCAB_ITEMS と同じ長さの配列）
  const [stats, setStats] = useState(() =>
    VOCAB_ITEMS.map(() => ({ correct: 0, wrong: 0 })),
  );

  // localStorage復元が完了したか（無限ループ/上書きを防ぐ）
  const didLoadFromStorageRef = useRef(false);

  // スコアリング
  const [score, setScore] = useState(0);
  // total = 現在の問題番号（1〜10）
  const [total, setTotal] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // 出題状態
  // SSR/CSRで初回描画を一致させる（hydration mismatch対策）
  const [index, setIndex] = useState(0);
  // 1プレイ内で同じ問題が出ないように記録（再レンダリング不要なのでrefでOK）
  const seenInPlayRef = useRef(null);
  if (seenInPlayRef.current === null) {
    seenInPlayRef.current = new Set([index]);
  }
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [dashboardReturnView, setDashboardReturnView] = useState("study");
  const [unlockedPoolSize, setUnlockedPoolSize] = useState(() =>
    Math.min(INITIAL_POOL_SIZE, VOCAB_ITEMS.length),
  );
  const [lastUnlockCount, setLastUnlockCount] = useState(0);
  const resultReadyRef = useRef(false);
  const resultUnlockAppliedRef = useRef(false);

  const q = VOCAB_ITEMS[index];
  const correctSoundRef = useRef(null);
  const answeredCount = checked ? total : total - 1;
  const currentSessionAccuracy =
    answeredCount <= 0 ? 1 : score / answeredCount;

  const normalizedAnswers = useMemo(() => {
    return (q?.answers ?? []).map(normalizeAnswer);
  }, [q]);

  // 初回マウント後にランダム出題へ切り替える（初回SSRと一致させた後でOK）
  useEffect(() => {
    if (typeof window === "undefined") return;
    correctSoundRef.current = new Audio("/success.mp3");
    correctSoundRef.current.volume = 0.75;
    correctSoundRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    if (!checked || !isCorrect) return;
    if (!correctSoundRef.current) return;
    correctSoundRef.current.currentTime = 0;
    correctSoundRef.current.play().catch(() => {
      // ブラウザの再生制限などは無視
    });
  }, [checked, isCorrect]);

  // 起動時にlocalStorageから学習履歴を復元（壊れていたら無視）
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage) return;

    try {
      const rawPoolSize = window.localStorage.getItem(POOL_STORAGE_KEY);
      const savedPoolSize = Number(rawPoolSize);
      if (Number.isFinite(savedPoolSize) && savedPoolSize > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUnlockedPoolSize(
          Math.max(
            Math.min(INITIAL_POOL_SIZE, VOCAB_ITEMS.length),
            Math.min(Math.floor(savedPoolSize), VOCAB_ITEMS.length),
          ),
        );
      }

      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        didLoadFromStorageRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        didLoadFromStorageRef.current = true;
        return;
      }

      // targetをキーにしてマージする
      const map = new Map();
      for (const item of parsed) {
        if (!item || typeof item !== "object") continue;
        const correct = Number(item.correct);
        const wrong = Number(item.wrong);
        const safe = {
          correct: Number.isFinite(correct) && correct >= 0 ? correct : 0,
          wrong: Number.isFinite(wrong) && wrong >= 0 ? wrong : 0,
        };
        if (typeof item.id === "string") {
          map.set(item.id, safe);
          continue;
        }
        // 以前の保存形式（target のみ）との互換
        const target = item.target;
        if (typeof target === "string") {
          const idx = VOCAB_ITEMS.findIndex((v) => v.target === target);
          if (idx >= 0) map.set(VOCAB_ITEMS[idx].id, safe);
        }
      }

      setStats((prev) =>
        VOCAB_ITEMS.map((v, i) => {
          const saved = map.get(v.id);
          const base = prev[i] ?? { correct: 0, wrong: 0 };
          return saved ? { correct: saved.correct, wrong: saved.wrong } : base;
        }),
      );
    } catch {
      // JSONが壊れている等は無視して初期化のまま
    } finally {
      didLoadFromStorageRef.current = true;
    }
  }, []);

  // 回答後の更新をlocalStorageへ保存（statsが変わったら保存）
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage) return;
    if (!didLoadFromStorageRef.current) return;

    try {
      const payload = VOCAB_ITEMS.map((v, i) => ({
        id: v.id,
        target: v.target,
        correct: stats[i]?.correct ?? 0,
        wrong: stats[i]?.wrong ?? 0,
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 保存できない環境（容量不足等）は黙って無視
    }
  }, [stats]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage) return;
    if (!didLoadFromStorageRef.current) return;

    try {
      window.localStorage.setItem(POOL_STORAGE_KEY, String(unlockedPoolSize));
    } catch {
      // 保存できない環境（容量不足等）は黙って無視
    }
  }, [unlockedPoolSize]);

  const progress = `${total} / ${PLAY_LIMIT}`;
  const progressPct = Math.max(0, Math.min(100, (total / PLAY_LIMIT) * 100));

  const pickNextQuestionIndex = useCallback(
    (avoidIndex, seenSet) => {
      const poolLimit = Math.max(1, Math.min(unlockedPoolSize, VOCAB_ITEMS.length));
      let candidates = Array.from({ length: poolLimit }, (_, i) => i).filter(
        (i) => !seenSet?.has(i),
      );

      if (typeof avoidIndex === "number" && candidates.length > 1) {
        candidates = candidates.filter((i) => i !== avoidIndex);
      }
      if (candidates.length === 0) return null;

      const fresh = candidates.filter((i) => getAttempts(stats[i]) === 0);
      const practiced = candidates.filter((i) => getAttempts(stats[i]) > 0);
      const shouldTryFresh =
        fresh.length > 0 &&
        (practiced.length === 0 ||
          (currentSessionAccuracy >= 0.7 && Math.random() < 0.28));

      if (shouldTryFresh) {
        return pickRandomIndex(fresh);
      }

      return weightedPickIndex(candidates, (i) =>
        getQuestionWeight(stats[i], currentSessionAccuracy),
      );
    },
    [currentSessionAccuracy, stats, unlockedPoolSize],
  );

  const checkAnswer = () => {
    // 二重加算防止
    if (checked || activeView === "result") return;

    const user = normalizeAnswer(input);
    const ok = normalizedAnswers.includes(user);
    setIsCorrect(ok);
    setChecked(true);

    // 問題別 correct / wrong 更新（immutable）
    setStats((prev) => {
      const next = [...prev];
      const cur = next[index] ?? { correct: 0, wrong: 0 };
      next[index] = ok
        ? { correct: cur.correct + 1, wrong: cur.wrong }
        : { correct: cur.correct, wrong: cur.wrong + 1 };
      return next;
    });

    // スコアリング更新（totalは「次へ」で増やす）
    if (ok) {
      setScore((s) => s + 1);
      setStreak((st) => {
        const nextStreak = st + 1;
        setBestStreak((best) => Math.max(best, nextStreak));
        return nextStreak;
      });
    } else {
      setStreak(0);
    }

  };

  const applyPoolUnlock = useCallback((finalScore) => {
    if (resultUnlockAppliedRef.current) return;
    resultUnlockAppliedRef.current = true;

    const step = getUnlockStep(finalScore, PLAY_LIMIT);
    if (step <= 0) {
      setLastUnlockCount(0);
      return;
    }

    setUnlockedPoolSize((prev) => {
      const nextSize = Math.min(prev + step, VOCAB_ITEMS.length);
      setLastUnlockCount(nextSize - prev);
      return nextSize;
    });
  }, []);

  const next = () => {
    if (!checked || activeView === "result") return;

    // 10問目を終えたら結果表示（totalは10/10のまま）
    if (total >= PLAY_LIMIT) {
      applyPoolUnlock(score);
      setActiveView("result");
      return;
    }

    // 次の問題に切り替わったタイミングで問題番号を+1
    setTotal((t) => t + 1);

    const nextIndex = pickNextQuestionIndex(index, seenInPlayRef.current);
    if (nextIndex === null) {
      // 未出題がもう無い場合（問題数が少ない等）
      applyPoolUnlock(score);
      setActiveView("result");
      return;
    }
    seenInPlayRef.current.add(nextIndex);
    setIndex(nextIndex);
    setInput("");
    setChecked(false);
    setIsCorrect(false);
  };

  const openDashboard = useCallback((returnView = "study") => {
    setDashboardReturnView(returnView);
    setActiveView("dashboard");
  }, []);

  const resetPlayState = useCallback(() => {
    setScore(0);
    setTotal(1);
    setStreak(0);
    setBestStreak(0);
    // 累積の正解・不正解は localStorage に残すため、ここでは stats はリセットしない
    const newIndex = pickNextQuestionIndex(null, new Set()) ?? 0;
    setIndex(newIndex);
    seenInPlayRef.current = new Set([newIndex]);
    setInput("");
    setChecked(false);
    setIsCorrect(false);
    setLastUnlockCount(0);
    resultUnlockAppliedRef.current = false;
  }, [pickNextQuestionIndex]);

  const startGame = useCallback(() => {
    resetPlayState();
    setActiveView("study");
  }, [resetPlayState]);

  const restart = useCallback(() => {
    resetPlayState();
    setActiveView("study");
  }, [resetPlayState]);

  const backToStart = useCallback(() => {
    resetPlayState();
    setActiveView("start");
  }, [resetPlayState]);

  useEffect(() => {
    if (activeView !== "start") return;

    const handleKeyDown = (event) => {
      if (event.key !== "Enter") return;
      startGame();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeView, startGame]);

  useEffect(() => {
    if (activeView !== "result") {
      resultReadyRef.current = false;
      return;
    }

    // 結果画面を表示してから、Enter 再開を有効にする
    resultReadyRef.current = false;
    const timeout = window.setTimeout(() => {
      resultReadyRef.current = true;
    }, 50);

    const handleKeyDown = (event) => {
      if (event.key !== "Enter") return;
      if (!resultReadyRef.current) return;
      restart();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeView, restart]);

  if (!q) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border bg-white p-6">
          <h1 className="text-xl font-semibold">英単語クイズ</h1>
          <p className="mt-3 text-zinc-700">問題データがありません。</p>
        </div>
      </div>
    );
  }

  if (activeView === "dashboard") {
    return (
      <ProgressDashboard
        stats={stats}
        totalWords={VOCAB_ITEMS.length}
        onBack={() => setActiveView(dashboardReturnView)}
      />
    );
  }

  if (activeView === "result") {
    return (
      <ResultScreen
        score={score}
        bestStreak={bestStreak}
        playLimit={PLAY_LIMIT}
        unlockedPoolSize={unlockedPoolSize}
        totalWords={VOCAB_ITEMS.length}
        unlockedThisRun={lastUnlockCount}
        onRestart={restart}
        onOpenDashboard={() => openDashboard("result")}
        onBackToStart={backToStart}
      />
    );
  }

  if (activeView === "start") {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm text-center">
          <h1 className="text-3xl font-semibold">英単語クイズ</h1>
          <p className="mt-4 text-zinc-600">Enter を押して 1プレイを開始します。</p>
          <p className="mt-2 text-sm text-zinc-500">
            現在の出題プール:{" "}
            <span className="font-semibold tabular-nums text-zinc-700">
              {unlockedPoolSize}
            </span>{" "}
            / {VOCAB_ITEMS.length} 語
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={startGame}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-zinc-900 px-6 text-white hover:bg-zinc-800"
            >
              1プレイ開始
            </button>
            <button
              type="button"
              onClick={() => openDashboard("start")}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 text-zinc-900 hover:bg-zinc-50"
            >
              進捗を見る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">英単語クイズ</h1>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div
              className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200"
              role="progressbar"
              aria-label="progress"
              aria-valuenow={total}
              aria-valuemin={1}
              aria-valuemax={PLAY_LIMIT}
            >
              <div
                className="h-full rounded-full bg-zinc-900 transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="text-xs tabular-nums text-zinc-500">{progress}</div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-zinc-600">
          <div>
            Score: {score} / {PLAY_LIMIT}
          </div>
          <div>
            Pool: {unlockedPoolSize} / {VOCAB_ITEMS.length}
          </div>
          <div className="inline-flex items-center gap-2">
            <span>最高ストリーク: {bestStreak}</span>
            {checked && isCorrect && getPraiseMessage(streak) && (
              <span
                className={`text-sm font-medium ${getPraiseMessage(streak).color}`}
              >
                {getPraiseMessage(streak).label}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-zinc-50 px-4 py-6 text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {getPartOfSpeech(q)}
          </div>
          <div className="mt-2 break-words text-4xl font-semibold text-zinc-950 sm:text-5xl">
            {q.target}
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-zinc-700">
            英単語の日本語訳
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-zinc-900/10"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (checked) next();
              else checkAnswer();
            }}
          />

          {checked && (
            <div className="mt-3">
              {isCorrect ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                  <div className="text-base font-semibold">正解！</div>
                </div>
              ) : (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
                  不正解。正解例: {normalizedAnswers.join(" / ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={checkAnswer}
            disabled={checked}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-800"
          >
            答え合わせ
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!checked}
            className="inline-flex h-11 items-center justify-center rounded-xl border px-5 font-medium text-zinc-900 hover:bg-zinc-50"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}

