"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PokemonBox from "./components/PokemonBox";
import PokemonParty from "./components/PokemonParty";
import ProgressDashboard from "./components/ProgressDashboard";
import ResultScreen from "./components/ResultScreen";
import ToastQueue from "./components/ToastQueue";

import {
  applyCaptureResultToCollection,
  pickHabitat,
  rollCaptureEncounter,
} from "@/lib/capture";
import { evaluatePlay } from "@/lib/playEvaluation";
import {
  clampMonsterXP,
  DEFAULT_MONSTER_COLLECTION,
  BOX_LIMIT,
  getActiveMonster,
  getBoxCount,
  getPoolTier,
  getMonsterDisplayState,
  getMonsterLine,
  getSpecies,
  levelFromTotalXP,
  normalizeMonsterCollection,
  normalizeMonsterLineId,
  sendPartySlotToBox,
  sendMonstersToProfessor,
  setActiveMonster,
  sortBoxMonsters,
  swapMonsterLocations,
  updatePartyXP,
} from "@/lib/monster";
import { normalizeAnswer } from "@/lib/answerNormalization";
import { QUESTIONS } from "@/lib/vocab";
import SyncButton from "./components/SyncButton";



/** 各問題に安定した ID */
const VOCAB_ITEMS = QUESTIONS.map((q, i) => ({ ...q, id: `w${i}` }));

const STORAGE_KEY        = "vocab-progress";
const POOL_STORAGE_KEY   = "vocab-active-pool-size";
const MONSTER_STORAGE_KEY = "monster-total-xp";
const MONSTER_LINE_STORAGE_KEY = "monster-line-id";
const MONSTER_COLLECTION_STORAGE_KEY = "monster-collection";

const INITIAL_POOL_SIZE  = 60;
const UNLOCK_ACCURACY    = 0.8;
const UNLOCK_STEP        = 30;
const PERFECT_UNLOCK_STEP = 50;
const PRIMARY_BUTTON_CLASS = "inline-flex h-12 min-w-32 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40";
const SECONDARY_BUTTON_CLASS = "inline-flex h-12 min-w-32 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-40";

function getPartOfSpeech(q) { return q?.partOfSpeech ?? "word"; }

function getPraiseMessage(streak) {
  if (streak >= 8)  return { label: "MARVELOUS!!!", color: "text-red-600" };
  if (streak >= 6)  return { label: "AMAZING!!",   color: "text-violet-600" };
  if (streak >= 4)  return { label: "EXCELLENT!",  color: "text-blue-600" };
  if (streak >= 2)  return { label: "GOOD",        color: "text-sky-400" };
  return null;
}

function pickRandomIndex(indices) {
  return indices[Math.floor(Math.random() * indices.length)];
}

function getAttempts(stat) { return (stat?.correct ?? 0) + (stat?.wrong ?? 0); }

function weightedPickIndex(indices, getWeight) {
  const weighted = indices.map(i => ({ index: i, weight: Math.max(0.01, getWeight(i)) }));
  const total = weighted.reduce((s, x) => s + x.weight, 0);
  let cursor = Math.random() * total;
  for (const item of weighted) { cursor -= item.weight; if (cursor <= 0) return item.index; }
  return weighted.at(-1)?.index ?? null;
}

function getQuestionWeight(stat, currentAccuracy) {
  const correct = stat?.correct ?? 0;
  const wrong   = stat?.wrong   ?? 0;
  const attempts = correct + wrong;
  if (attempts === 0) return currentAccuracy < 0.65 ? 0.25 : 1.8;
  const weakness        = wrong / (correct + 1);
  const confidenceBoost = correct >= 2 && wrong === 0 ? 0.45 : 1;
  const recoveryBoost   = wrong > 0 ? 2.2 + weakness * 3 : 0;
  const stillLearning   = Math.max(0, 3 - correct) * 0.35;
  return (1 + recoveryBoost + stillLearning) * confidenceBoost;
}

function getUnlockStep(score, playLimit) {
  const accuracy = score / playLimit;
  if (accuracy >= 1)             return PERFECT_UNLOCK_STEP;
  if (accuracy >= UNLOCK_ACCURACY) return UNLOCK_STEP;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Page() {
  const PLAY_LIMIT = 10;

  const [activeView, setActiveView]   = useState("start");
  const [stats, setStats]             = useState(() => VOCAB_ITEMS.map(() => ({ correct: 0, wrong: 0 })));

  const didLoadFromStorageRef = useRef(false);

  const [score, setScore]             = useState(0);
  const [total, setTotal]             = useState(1);
  const [streak, setStreak]           = useState(0);
  const [bestStreak, setBestStreak]   = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [resultEvaluation, setResultEvaluation] = useState(null);
  const [captureResult, setCaptureResult] = useState(null);
  const [currentHabitat, setCurrentHabitat] = useState(null);
  const [flowPlayCount, setFlowPlayCount] = useState(1);
  const [toastQueue, setToastQueue] = useState([]);
  const [activeToast, setActiveToast] = useState(null);

  const [index, setIndex]             = useState(0);
  const inputRef = useRef(null);
  const seenInPlayRef = useRef(null);
  if (seenInPlayRef.current === null) seenInPlayRef.current = new Set([index]);

  const [input, setInput]             = useState("");
  const [checked, setChecked]         = useState(false);
  const [isCorrect, setIsCorrect]     = useState(false);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [dashboardReturnView, setDashboardReturnView] = useState("study");

  const [unlockedPoolSize, setUnlockedPoolSize] = useState(() =>
    Math.min(INITIAL_POOL_SIZE, VOCAB_ITEMS.length),
  );
  const [lastUnlockCount, setLastUnlockCount] = useState(0);

  // ── モンスター個体 ────────────────────────────────────────────────────────
  const [monsterCollection, setMonsterCollection] = useState(() =>
    normalizeMonsterCollection(DEFAULT_MONSTER_COLLECTION),
  );
  const [isPokemonBoxOpen, setIsPokemonBoxOpen] = useState(false);

  const resultReadyRef          = useRef(false);
  const resultUnlockAppliedRef  = useRef(false);

  const q = VOCAB_ITEMS[index];
  const correctSoundRef = useRef(null);
  const levelUpSoundRef = useRef(null);
  const evolutionSoundRef = useRef(null);
  const monsterCollectionRef = useRef(monsterCollection);
  const currentHabitatRef = useRef(null);
  const activeMonster = getActiveMonster(monsterCollection);
  const answeredCount   = checked ? total : total - 1;
  const currentSessionAccuracy = answeredCount <= 0 ? 1 : score / answeredCount;
  const boxCount = getBoxCount(monsterCollection);
  const isBoxOverLimit = boxCount > BOX_LIMIT;

  const enqueueToast = useCallback((toast) => {
    setToastQueue((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        duration: 800,
        ...toast,
      },
    ]);
  }, []);

  useEffect(() => {
    if (activeToast || toastQueue.length === 0) return;
    setActiveToast(toastQueue[0]);
    setToastQueue((prev) => prev.slice(1));
  }, [activeToast, toastQueue]);

  const dismissActiveToast = useCallback(() => setActiveToast(null), []);

  function buildPartyChangeToasts(previousCollection, nextCollection) {
    const prev = normalizeMonsterCollection(previousCollection);
    const next = normalizeMonsterCollection(nextCollection);
    const activeId = next.activeId;
    const partyIds = next.partyIds.filter(Boolean);
    const orderedIds = [...new Set([activeId, ...partyIds])].filter(Boolean);

    const events = [];
    for (const monsterId of orderedIds) {
      const prevMonster = prev.monsters.find((mon) => mon.id === monsterId);
      const nextMonster = next.monsters.find((mon) => mon.id === monsterId);
      if (!prevMonster || !nextMonster) continue;

      const prevState = getMonsterDisplayState(prevMonster);
      const nextState = getMonsterDisplayState(nextMonster);
      const isActive = monsterId === activeId;

      if (!prevMonster.heldItemType && nextMonster.heldItemType) {
        events.push({
          title: "アイテムをひろった！",
          message: `${nextState.species.name}が${nextMonster.heldItemName}をひろった！`,
          image: nextState.species.sprite,
          isActive,
        });
      }
      if (nextState.level > prevState.level) {
        events.push({
          title: "レベルアップ",
          message: `${nextState.species.name}のレベルがあがった！`,
          image: nextState.species.sprite,
          detail: `Lv.${prevState.level} → Lv.${nextState.level}`,
          isActive,
        });
      }
      if (nextState.species.id !== prevState.species.id) {
        events.push({
          title: "進化！",
          message: `${nextState.species.name}に進化した！`,
          image: nextState.species.sprite,
          detail: `${prevState.species.name} → ${nextState.species.name}`,
          isActive,
        });
      }
    }
    return events;
  }

  const normalizedAnswers = useMemo(
    () => (q?.answers ?? []).map(normalizeAnswer),
    [q],
  );

  const playEvaluation = useMemo(
    () => evaluatePlay({ answers: sessionAnswers, score, playLimit: PLAY_LIMIT, bestStreak, unlockedPoolSize, playCount: flowPlayCount }),
    [bestStreak, flowPlayCount, score, sessionAnswers, unlockedPoolSize],
  );

  const selectNextHabitat = useCallback((poolSize = unlockedPoolSize, collection = monsterCollectionRef.current) => {
    const habitat = pickHabitat({
      unlockedPoolSize: poolSize,
      habitatVisits: collection?.habitatVisits ?? {},
      rng: Math.random,
    });
    currentHabitatRef.current = habitat;
    setCurrentHabitat(habitat);
    return habitat;
  }, [unlockedPoolSize]);

  // ── 音声 ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    correctSoundRef.current = new Audio("/success.mp3");
    correctSoundRef.current.volume = 0.75;
    correctSoundRef.current.preload = "auto";

    levelUpSoundRef.current = new Audio("/levelup.mp3");
    levelUpSoundRef.current.volume = 0.85;
    levelUpSoundRef.current.preload = "auto";

    evolutionSoundRef.current = new Audio("/pokemon-evolve.mp3");
    evolutionSoundRef.current.volume = 0.85;
    evolutionSoundRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    if (!checked || !isCorrect || !correctSoundRef.current) return;
    correctSoundRef.current.currentTime = 0;
    correctSoundRef.current.play().catch(() => {});
  }, [checked, isCorrect]);

  useEffect(() => {
    monsterCollectionRef.current = monsterCollection;
  }, [monsterCollection]);

  useEffect(() => {
    if (activeView !== "study" || isCheckingAnswer) return;
    inputRef.current?.focus();
  }, [activeView, checked, index, isCheckingAnswer]);

  // ── localStorage 復元 ──────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      // プールサイズ
      let loadedPoolSize = Math.min(INITIAL_POOL_SIZE, VOCAB_ITEMS.length);
      const rawPool = window.localStorage.getItem(POOL_STORAGE_KEY);
      const savedPool = Number(rawPool);
      if (Number.isFinite(savedPool) && savedPool > 0) {
        loadedPoolSize = Math.max(
          Math.min(INITIAL_POOL_SIZE, VOCAB_ITEMS.length),
          Math.min(Math.floor(savedPool), VOCAB_ITEMS.length),
        );
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUnlockedPoolSize(loadedPoolSize);
      }

      // モンスター XP
      const rawXP = window.localStorage.getItem(MONSTER_STORAGE_KEY);
      const savedXP = clampMonsterXP(rawXP);
      const savedMonsterLineId = window.localStorage.getItem(MONSTER_LINE_STORAGE_KEY);
      const rawCollection = window.localStorage.getItem(MONSTER_COLLECTION_STORAGE_KEY);
      const savedCollection = rawCollection ? JSON.parse(rawCollection) : null;
      const normalizedCollection = normalizeMonsterCollection(savedCollection, {
        lineId: normalizeMonsterLineId(savedMonsterLineId),
        totalXP: savedXP,
      });
      monsterCollectionRef.current = normalizedCollection;
      setMonsterCollection(normalizedCollection);
      const loadedHabitat = pickHabitat({
        unlockedPoolSize: loadedPoolSize,
        habitatVisits: normalizedCollection.habitatVisits,
        rng: Math.random,
      });
      currentHabitatRef.current = loadedHabitat;
      setCurrentHabitat(loadedHabitat);

      // 単語進捗
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) { didLoadFromStorageRef.current = true; return; }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) { didLoadFromStorageRef.current = true; return; }

      const map = new Map();
      for (const item of parsed) {
        if (!item || typeof item !== "object") continue;
        const correct = Number(item.correct);
        const wrong   = Number(item.wrong);
        const safe = {
          correct: Number.isFinite(correct) && correct >= 0 ? correct : 0,
          wrong:   Number.isFinite(wrong)   && wrong   >= 0 ? wrong   : 0,
        };
        if (typeof item.id === "string") { map.set(item.id, safe); continue; }
        const idx = VOCAB_ITEMS.findIndex(v => v.target === item.target);
        if (idx >= 0) map.set(VOCAB_ITEMS[idx].id, safe);
      }

      setStats(prev =>
        VOCAB_ITEMS.map((v, i) => {
          const saved = map.get(v.id);
          return saved ? { correct: saved.correct, wrong: saved.wrong } : (prev[i] ?? { correct: 0, wrong: 0 });
        }),
      );
    } catch { /* 破損データは無視 */ } finally {
      didLoadFromStorageRef.current = true;
    }
  }, []);

  // ── localStorage 保存 ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage || !didLoadFromStorageRef.current) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(VOCAB_ITEMS.map((v, i) => ({
          id: v.id, target: v.target,
          correct: stats[i]?.correct ?? 0,
          wrong:   stats[i]?.wrong   ?? 0,
        }))),
      );
    } catch { /* 容量不足等は無視 */ }
  }, [stats]);

  useEffect(() => {
    if (!didLoadFromStorageRef.current) return;
    try { window.localStorage.setItem(POOL_STORAGE_KEY, String(unlockedPoolSize)); } catch { /* 無視 */ }
  }, [unlockedPoolSize]);

  useEffect(() => {
    if (!didLoadFromStorageRef.current) return;
    try {
      const active = getActiveMonster(monsterCollection);
      window.localStorage.setItem(MONSTER_COLLECTION_STORAGE_KEY, JSON.stringify(monsterCollection));
      window.localStorage.setItem(MONSTER_STORAGE_KEY, String(active.totalXP));
      window.localStorage.setItem(MONSTER_LINE_STORAGE_KEY, active.lineId);
    } catch { /* 無視 */ }
  }, [monsterCollection]);

  // ── 出題 ──────────────────────────────────────────────────────────────────
  const progress    = `${total} / ${PLAY_LIMIT}`;
  const progressPct = Math.max(0, Math.min(100, (total / PLAY_LIMIT) * 100));

  const pickNextQuestionIndex = useCallback(
    (avoidIndex, seenSet) => {
      const poolLimit  = Math.max(1, Math.min(unlockedPoolSize, VOCAB_ITEMS.length));
      let candidates   = Array.from({ length: poolLimit }, (_, i) => i).filter(i => !seenSet?.has(i));
      if (typeof avoidIndex === "number" && candidates.length > 1)
        candidates = candidates.filter(i => i !== avoidIndex);
      if (candidates.length === 0) return null;

      const fresh     = candidates.filter(i => getAttempts(stats[i]) === 0);
      const practiced = candidates.filter(i => getAttempts(stats[i]) > 0);
      const tryFresh  = fresh.length > 0 &&
        (practiced.length === 0 || (currentSessionAccuracy >= 0.7 && Math.random() < 0.28));

      return tryFresh
        ? pickRandomIndex(fresh)
        : weightedPickIndex(candidates, i => getQuestionWeight(stats[i], currentSessionAccuracy));
    },
    [currentSessionAccuracy, stats, unlockedPoolSize],
  );

  // ── 答え合わせ ─────────────────────────────────────────────────────────────
  const checkAnswer = async () => {
    if (checked || isCheckingAnswer || activeView === "result") return;
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
        body: JSON.stringify({ input, answers: q?.answers ?? [] }),
      });

      if (response.ok) result = await response.json();
    } catch {
      // Keep exact-match grading available if the local API cannot answer.
    } finally {
      setIsCheckingAnswer(false);
    }

    const ok = result.status === "exact" || result.status === "alternative";
    const prev = stats[index] ?? { correct: 0, wrong: 0 };

    setIsCorrect(ok);
    setAnswerStatus(result.status);
    setChecked(true);
    setSessionAnswers(a => [...a, {
      id: q.id, correct: ok,
      previousCorrect: prev.correct, previousWrong: prev.wrong,
    }]);

    setStats(prev => {
      const next = [...prev];
      const cur  = next[index] ?? { correct: 0, wrong: 0 };
      next[index] = ok
        ? { correct: cur.correct + 1, wrong: cur.wrong }
        : { correct: cur.correct,     wrong: cur.wrong + 1 };
      return next;
    });

    if (ok) {
      setScore(s => s + 1);
      setStreak(st => {
        const ns = st + 1;
        setBestStreak(b => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }
  };

  // ── プレイ終了処理（プール解放 + XP 付与）────────────────────────────────
  const applyEndOfPlay = useCallback((finalScore, finalBestStreak, currentPoolSize, finalAnswers, finalHabitat, playCount) => {
    if (resultUnlockAppliedRef.current) return;
    resultUnlockAppliedRef.current = true;

    const finalEvaluation = evaluatePlay({
      answers: finalAnswers,
      score: finalScore,
      playLimit: PLAY_LIMIT,
      bestStreak: finalBestStreak,
      unlockedPoolSize: currentPoolSize,
      playCount,
    });
    setResultEvaluation(finalEvaluation);

    // プール解放
    const step = getUnlockStep(finalScore, PLAY_LIMIT);
    if (step > 0) {
      setUnlockedPoolSize(prev => {
        const next = Math.min(prev + step, VOCAB_ITEMS.length);
        setLastUnlockCount(next - prev);
        return next;
      });
    } else {
      setLastUnlockCount(0);
    }

    // モンスター XP 付与（結果画面に表示する XP と同じ値を使う）
    const gained = finalEvaluation.xp ?? 0;
    const currentCollection = monsterCollectionRef.current;
    const currentMonster = getActiveMonster(currentCollection);
    const previousXP = currentMonster.totalXP;
    const nextXP = clampMonsterXP(previousXP + gained);
    const previousLevel = levelFromTotalXP(previousXP);
    const nextLevel = levelFromTotalXP(nextXP);
    const didLevelUp = nextLevel > previousLevel;
    const didEvolve =
      getSpecies(previousLevel, currentMonster.lineId).id !==
      getSpecies(nextLevel, currentMonster.lineId).id;

    const leveledCollection = updatePartyXP(currentCollection, gained);

    const capture = rollCaptureEncounter({
      grade: finalEvaluation.grade,
      unlockedPoolSize: currentPoolSize,
      habitatVisits: leveledCollection.habitatVisits,
      seed: `${Date.now()}-${Math.random()}`,
      habitat: finalHabitat,
      monsterCollection: leveledCollection,
    });
    const nextCollection = applyCaptureResultToCollection(leveledCollection, capture);
    setCaptureResult(capture);
    monsterCollectionRef.current = nextCollection;
    setMonsterCollection(nextCollection);

    if (capture?.caught) {
      const capturedLine = getMonsterLine(capture.lineId);
      if (capturedLine) {
        enqueueToast({
          title: "ポケモン捕獲！",
          message: `${capturedLine.name}を捕まえた！`,
          image: capturedLine.sprite,
        });
      }
    }

    const partyToasts = buildPartyChangeToasts(currentCollection, nextCollection);
    partyToasts.forEach((toast) => enqueueToast(toast));

    if (didEvolve && evolutionSoundRef.current) {
      evolutionSoundRef.current.currentTime = 0;
      evolutionSoundRef.current.play().catch(() => {});
    } else if (didLevelUp && levelUpSoundRef.current) {
      levelUpSoundRef.current.currentTime = 0;
      levelUpSoundRef.current.play().catch(() => {});
    }
  }, []); // すべての入力をパラメータで受け取るので deps 不要

  // ── 次へ ───────────────────────────────────────────────────────────────────
  const next = () => {
    if (!checked || activeView === "result") return;

    if (total >= PLAY_LIMIT) {
      applyEndOfPlay(score, bestStreak, unlockedPoolSize, sessionAnswers, currentHabitatRef.current, flowPlayCount);
      setActiveView("result");
      return;
    }

    setTotal(t => t + 1);
    const nextIndex = pickNextQuestionIndex(index, seenInPlayRef.current);
    if (nextIndex === null) {
      applyEndOfPlay(score, bestStreak, unlockedPoolSize, sessionAnswers, currentHabitatRef.current, flowPlayCount);
      setActiveView("result");
      return;
    }
    seenInPlayRef.current.add(nextIndex);
    setIndex(nextIndex);
    setInput("");
    setChecked(false);
    setIsCorrect(false);
    setAnswerStatus(null);
  };

  const openDashboard = useCallback((returnView = "study") => {
    setDashboardReturnView(returnView);
    setActiveView("dashboard");
  }, []);

  const resetPlayState = useCallback(({ keepHabitat = true } = {}) => {
    setScore(0); setTotal(1); setStreak(0); setBestStreak(0); setSessionAnswers([]);
    setResultEvaluation(null);
    setCaptureResult(null);
    if (!keepHabitat || !currentHabitatRef.current) selectNextHabitat();
    const newIndex = pickNextQuestionIndex(null, new Set()) ?? 0;
    setIndex(newIndex);
    seenInPlayRef.current = new Set([newIndex]);
    setInput(""); setChecked(false); setIsCorrect(false); setAnswerStatus(null); setLastUnlockCount(0);
    resultUnlockAppliedRef.current = false;
  }, [pickNextQuestionIndex, selectNextHabitat]);

  const startGame  = useCallback(() => {
    setFlowPlayCount(1);
    resetPlayState({ keepHabitat: true });
    setActiveView("study");
  }, [resetPlayState]);
  const restart    = useCallback(() => {
    setFlowPlayCount(count => count + 1);
    resetPlayState({ keepHabitat: true });
    setActiveView("study");
  }, [resetPlayState]);
  const backToStart = useCallback(() => {
    setFlowPlayCount(1);
    resetPlayState({ keepHabitat: false });
    setActiveView("start");
  }, [resetPlayState]);


const handleMerged = useCallback(
  ({ stats: mergedStats, unlockedPoolSize: mergedPool, monsterCollection: mergedCollection }) => {
    const normalizedCollection = normalizeMonsterCollection(mergedCollection);
    const active = getActiveMonster(normalizedCollection);
    setStats(mergedStats);
    setUnlockedPoolSize(mergedPool);
    monsterCollectionRef.current = normalizedCollection;
    setMonsterCollection(normalizedCollection);
    selectNextHabitat(mergedPool, normalizedCollection);

    // localStorage も即時更新
    try {
      window.localStorage.setItem(POOL_STORAGE_KEY, String(mergedPool));
      window.localStorage.setItem(MONSTER_COLLECTION_STORAGE_KEY, JSON.stringify(normalizedCollection));
      window.localStorage.setItem(MONSTER_STORAGE_KEY, String(active.totalXP));
      window.localStorage.setItem(MONSTER_LINE_STORAGE_KEY, active.lineId);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          VOCAB_ITEMS.map((v, i) => ({
            id: v.id,
            target: v.target,
            correct: mergedStats[i]?.correct ?? 0,
            wrong: mergedStats[i]?.wrong ?? 0,
          }))
        )
      );
    } catch { /* ignore */ }
  },
  [selectNextHabitat]
);


  // ── キーボードショートカット ───────────────────────────────────────────────
  useEffect(() => {
    if (activeView !== "start") return;
    const fn = e => {
      if (e.key !== "Enter" || e.target?.closest?.("button")) return;
      startGame();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [activeView, startGame]);

  useEffect(() => {
    if (activeView !== "result") { resultReadyRef.current = false; return; }
    resultReadyRef.current = false;
    const tid = window.setTimeout(() => { resultReadyRef.current = true; }, 50);
    const fn  = e => { if (e.key === "Enter" && resultReadyRef.current) restart(); };
    window.addEventListener("keydown", fn);
    return () => { window.clearTimeout(tid); window.removeEventListener("keydown", fn); };
  }, [activeView, restart]);

  // ── 現在の tier（スタート画面用） ─────────────────────────────────────────
  const currentTier = getPoolTier(unlockedPoolSize);

  useEffect(() => {
    if (currentHabitatRef.current) return;
    selectNextHabitat();
  }, [selectNextHabitat]);
  const shouldShowPokemonBox = isPokemonBoxOpen || isBoxOverLimit;

  // ─────────────────────────────────────────────────────────────────────────
  // ビュー分岐
  // ─────────────────────────────────────────────────────────────────────────

  if (!q) {
    return (
      <>
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border bg-white p-6">
            <h1 className="text-xl font-semibold">英単語クイズ</h1>
            <p className="mt-3 text-zinc-700">問題データがありません。</p>
          </div>
        </div>
        <ToastQueue toast={activeToast} onDismiss={dismissActiveToast} />
      </>
    );
  }

  if (activeView === "dashboard") {
    return (
      <>
        <ProgressDashboard
          stats={stats}
          totalWords={VOCAB_ITEMS.length}
          onBack={() => setActiveView(dashboardReturnView)}
        />
        <ToastQueue toast={activeToast} onDismiss={dismissActiveToast} />
      </>
    );
  }

  if (activeView === "result") {
    return (
      <>
        <ResultScreen
          score={score}
          bestStreak={bestStreak}
          playLimit={PLAY_LIMIT}
          unlockedPoolSize={unlockedPoolSize}
          totalWords={VOCAB_ITEMS.length}
          unlockedThisRun={lastUnlockCount}
          evaluation={resultEvaluation ?? playEvaluation}
          monster={activeMonster}
          onRestart={restart}
          onOpenDashboard={() => openDashboard("result")}
          onBackToStart={backToStart}
        />
        <ToastQueue toast={activeToast} onDismiss={dismissActiveToast} position="mobile-bottom" />
      </>
    );
  }

  if (activeView === "start") {
    return (
      <>
        <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl space-y-4">

          {/* タイトル */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-center">
            <h1 className="text-3xl font-semibold">英単語クイズ</h1>
            <p className="mt-2 text-zinc-600">Enter を押して 1プレイを開始します。</p>

            {/* プール情報 + ティアバッジ */}
            <div className="mt-3 inline-flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: currentTier.color }}
              >
                {currentTier.label} ×{currentTier.multiplier}
              </span>
              <span className="text-sm text-zinc-500">
                出題プール:{" "}
                <span className="font-semibold text-zinc-700">{unlockedPoolSize}</span>
                {" "}/ {VOCAB_ITEMS.length} 語
              </span>
            </div>
            <div className="mt-2 text-sm text-zinc-500">
              現在地:{" "}
              <span className="font-semibold text-zinc-700">
                {currentHabitat?.name || "なし"}
              </span>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={startGame}
                className={PRIMARY_BUTTON_CLASS}
              >
                1プレイ開始
              </button>
              <button
                type="button"
                onClick={() => openDashboard("start")}
                className={SECONDARY_BUTTON_CLASS}
              >
                進捗を見る
              </button>
              <button
                type="button"
                onClick={() => setIsPokemonBoxOpen(true)}
                aria-expanded={isPokemonBoxOpen}
                className={SECONDARY_BUTTON_CLASS}
              >
                ポケモン
              </button>
                <SyncButton
    stats={stats}
    unlockedPoolSize={unlockedPoolSize}
    monsterCollection={monsterCollection}
    onMerged={handleMerged}
  />
            </div>
          </div>

          {/* モンスター */}
          {shouldShowPokemonBox && (
            <PokemonBox
              collection={monsterCollection}
              limit={BOX_LIMIT}
              forceManage={isBoxOverLimit}
              onClose={() => setIsPokemonBoxOpen(false)}
              onSwap={(first, second) =>
                setMonsterCollection(prev => swapMonsterLocations(prev, first, second))
              }
              onRemove={partyIndex =>
                setMonsterCollection(prev => sendPartySlotToBox(prev, partyIndex))
              }
              onSendToProfessor={monsterIds =>
                setMonsterCollection(prev => sendMonstersToProfessor(prev, monsterIds))
              }
              onSortBox={mode =>
                setMonsterCollection(prev => sortBoxMonsters(prev, mode))
              }
            />
          )}

          <PokemonParty
            collection={monsterCollection}
            onSelect={monsterId => setMonsterCollection(prev => setActiveMonster(prev, monsterId))}
          />
        </div>
      </div>
      <ToastQueue toast={activeToast} onDismiss={dismissActiveToast} />
      </>
    );
  }

  // ── クイズ画面 ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">英単語クイズ</h1>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div
              className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200"
              role="progressbar"
              aria-valuenow={total} aria-valuemin={1} aria-valuemax={PLAY_LIMIT}
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
          <div>Score: {score} / {PLAY_LIMIT}</div>
          <div className="inline-flex items-center gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: currentTier.color }}
            >
              {currentTier.label} ×{currentTier.multiplier}
            </span>
          </div>
          <div className="inline-flex items-center gap-2">
            <span>最高ストリーク: {bestStreak}</span>
            {checked && isCorrect && getPraiseMessage(streak) && (
              <span className={`text-sm font-medium ${getPraiseMessage(streak).color}`}>
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
          <label className="block text-sm font-medium text-zinc-700">英単語の日本語訳</label>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-zinc-900/10"
            onKeyDown={e => {
              if (e.key !== "Enter") return;
              if (checked) next(); else checkAnswer();
            }}
            disabled={isCheckingAnswer}
          />

          {checked && (
            <div className="mt-3">
              {isCorrect ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                  <div className="text-base font-semibold">
                    {answerStatus === "alternative" ? "〇（別解）" : "〇"}
                  </div>
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
            type="button" onClick={checkAnswer} disabled={checked || isCheckingAnswer}
            className={PRIMARY_BUTTON_CLASS}
          >
            {isCheckingAnswer ? "判定中..." : "答え合わせ"}
          </button>
          <button
            type="button" onClick={next} disabled={!checked}
            className={SECONDARY_BUTTON_CLASS}
          >
            次へ
          </button>
        </div>
      </div>
    </div>
      <ToastQueue toast={activeToast} onDismiss={dismissActiveToast} />
    </>
  );
}
