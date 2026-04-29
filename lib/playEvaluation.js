const GRADE_BANDS = [
  { min: 94, grade: "S+", title: "定着がかなり強い" },
  { min: 88, grade: "S", title: "安定して思い出せている" },
  { min: 78, grade: "A", title: "よく身についている" },
  { min: 66, grade: "B", title: "伸びが見えている" },
  { min: 50, grade: "C", title: "復習の材料が集まった" },
  { min: 0, grade: "D", title: "ここから固めていこう" },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ratio(part, whole) {
  if (whole <= 0) return 0;
  return clamp(part / whole, 0, 1);
}

function getGrade(score) {
  return GRADE_BANDS.find((band) => score >= band.min) ?? GRADE_BANDS.at(-1);
}

function getPoolScoreMultiplier(unlockedPoolSize, basePoolSize = 1) {
  if (!Number.isFinite(unlockedPoolSize) || unlockedPoolSize <= 0) return 1;
  const base = Math.max(1, basePoolSize);
  const progress = Math.max(1, unlockedPoolSize / base);
  const bonusFactor = Math.sqrt(progress) - 1;
  return clamp(1 + bonusFactor * 0.18, 1, 1.3);
}

function getAttemptsBefore(answer) {
  return (answer?.previousCorrect ?? 0) + (answer?.previousWrong ?? 0);
}

function getMotivationMessage({ accuracy, recoveredWeakWords, newWords, score }) {
  if (score >= 88) {
    return "かなり良い回です。次はこの感覚を別の単語にも広げよう。";
  }
  if (recoveredWeakWords > 0) {
    return "前に崩れた単語を取り返せています。これは点数以上に強い伸びです。";
  }
  if (newWords > 0 && accuracy >= 0.6) {
    return "新しい単語に触れながら崩れすぎていません。学習として良い負荷です。";
  }
  if (accuracy >= 0.7) {
    return "土台はできています。迷った単語だけを軽く回収すると伸びやすいです。";
  }
  return "今回のミスは次回の出題優先度になります。覚える材料はちゃんと増えています。";
}

export function evaluatePlay({
  answers,
  score,
  playLimit,
  bestStreak,
  unlockedPoolSize,
  poolBaseSize = 1,
}) {
  const safeAnswers = Array.isArray(answers) ? answers : [];
  const answered =
    safeAnswers.length > 0 ? safeAnswers.length : Math.max(Math.floor(playLimit ?? 0), 0);
  const answerCorrectCount = safeAnswers.filter((answer) => answer?.correct).length;
  const correctCount =
    Number.isFinite(score) && score >= 0
      ? clamp(score, 0, answered)
      : answerCorrectCount;
  const accuracy = ratio(correctCount, answered);

  const newWords = safeAnswers.filter((answer) => getAttemptsBefore(answer) === 0).length;
  const lowExposureWords = safeAnswers.filter((answer) => {
    const attemptsBefore = getAttemptsBefore(answer);
    return attemptsBefore > 0 && attemptsBefore <= 2;
  }).length;
  const recoveredWeakWords = safeAnswers.filter(
    (answer) =>
      answer?.correct &&
      (answer?.previousWrong ?? 0) > 0 &&
      (answer?.previousWrong ?? 0) >= (answer?.previousCorrect ?? 0),
  ).length;

  const accuracyPoints = accuracy * 68;
  const consistencyPoints = ratio(bestStreak ?? 0, answered) * 12;
  const recoveryPoints = ratio(recoveredWeakWords, Math.max(1, correctCount)) * 12;
  const challengePoints = ratio(newWords + lowExposureWords * 0.5, answered) * 8;
  const rawScore = accuracyPoints + consistencyPoints + recoveryPoints + challengePoints;
  const poolMultiplier = getPoolScoreMultiplier(unlockedPoolSize, poolBaseSize);
  const totalScore = Math.round(clamp(rawScore * poolMultiplier, 0, 100));
  const grade = getGrade(totalScore);

  return {
    score: totalScore,
    grade: grade.grade,
    title: grade.title,
    message: getMotivationMessage({
      accuracy,
      recoveredWeakWords,
      newWords,
      score: totalScore,
    }),
    breakdown: [
      {
        label: "正答の安定",
        points: Math.round(accuracyPoints),
        max: 68,
        detail: `${correctCount} / ${answered}`,
      },
      {
        label: "連続正解",
        points: Math.round(consistencyPoints),
        max: 12,
        detail: `最高 ${bestStreak ?? 0} 連続`,
      },
      {
        label: "苦手回収",
        points: Math.round(recoveryPoints),
        max: 12,
        detail: `${recoveredWeakWords} 語`,
      },
      {
        label: "挑戦量",
        points: Math.round(challengePoints),
        max: 8,
        detail: `新規 ${newWords} 語`,
      },
    ],
  };
}
