import { WordStat } from "./types";

/**
 * ミッションスタック型捕獲システムの中核。
 *
 * 出現エティモンには複数のミッションが積まれ、HPが尽きる（＝倒してしまう）
 * 前に全ミッションを達成すると捕獲できる。ミッションは学習行動
 * （苦手単語の克服・新出単語への挑戦・挑戦数・連続正解）と
 * パーティ編成（エティモン指定・レベル指定）から生成される。
 */

export type MissionType =
  | "attempts" // 問題への挑戦数（正誤問わず）
  | "weak-word" // 苦手単語への正解
  | "new-word" // 新出（未挑戦）単語への正解
  | "streak" // 連続正解
  | "party-etymon" // 指定エティモンを手持ちに入れて正解
  | "party-level"; // 指定レベル以上を手持ちに入れて正解

export interface Mission {
  id: string;
  type: MissionType;
  label: string;
  goal: number;
  progress: number;
  done: boolean;
  /** party-etymon 用: 対象ラインID */
  lineId?: string;
  /** party-etymon 用: 表示名 */
  lineName?: string;
  /** party-level 用: 必要レベル */
  minLevel?: number;
}

/** 1問回答するたびにミッション進行判定へ渡すイベント */
export interface MissionAnswerEvent {
  correct: boolean;
  /** 回答前の時点で苦手単語だったか */
  wasWeakWord: boolean;
  /** 回答前の時点で未挑戦（新出）単語だったか */
  wasNewWord: boolean;
  /** 回答後の連続正解数 */
  streak: number;
  /** バトル参加パーティのラインID一覧 */
  partyLineIds: string[];
  /** バトル参加パーティの最高レベル */
  partyMaxLevel: number;
}

export interface GenerateMissionsOptions {
  /** 出現エティモンのレベル。ミッション数と目標値のスケールに使う */
  level: number;
  /** プレイヤーが所持しているラインID（party-etymon ミッションの候補） */
  ownedLineIds?: string[];
  /** ラインIDから表示名を引く関数（未指定ならIDをそのまま表示） */
  getLineName?: (lineId: string) => string;
  /** バトル参加パーティの最高レベル（party-level を達成可能な値に抑える） */
  partyMaxLevel?: number;
  rng?: () => number;
}

/**
 * 苦手単語の判定。
 * 一度でも間違えていて、まだ間違いを上回る正解の貯金が薄い単語を苦手とみなす。
 */
export function isWeakWordStat(stat: WordStat | null | undefined): boolean {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  return wrong >= 1 && correct <= wrong + 1;
}

/** 新出（未挑戦）単語の判定 */
export function isNewWordStat(stat: WordStat | null | undefined): boolean {
  return (stat?.correct ?? 0) + (stat?.wrong ?? 0) === 0;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** 出現レベルに応じたミッション数。強い個体ほどミッションが多い */
export function getMissionCountForLevel(level: number): number {
  if (level < 12) return 2;
  if (level < 30) return 3;
  return 4;
}

interface MissionBlueprint {
  type: MissionType;
  build: (ctx: {
    level: number;
    rng: () => number;
    ownedLineIds: string[];
    getLineName: (lineId: string) => string;
    partyMaxLevel: number;
  }) => Omit<Mission, "id" | "progress" | "done"> | null;
}

const MISSION_BLUEPRINTS: MissionBlueprint[] = [
  {
    type: "weak-word",
    build: ({ level, rng }) => {
      const goal = clampInt(1 + level / 18 + rng(), 1, 4);
      return {
        type: "weak-word",
        goal,
        label: `苦手な単語に${goal}回正解`,
      };
    },
  },
  {
    type: "new-word",
    build: ({ level, rng }) => {
      const goal = clampInt(1 + level / 15 + rng(), 1, 5);
      return {
        type: "new-word",
        goal,
        label: `新しい単語に${goal}回正解`,
      };
    },
  },
  {
    type: "streak",
    build: ({ level, rng }) => {
      const goal = clampInt(3 + level / 20 + rng(), 3, 7);
      return {
        type: "streak",
        goal,
        label: `${goal}問連続で正解`,
      };
    },
  },
  {
    type: "party-etymon",
    build: ({ rng, ownedLineIds, getLineName }) => {
      if (ownedLineIds.length === 0) return null;
      const lineId =
        ownedLineIds[Math.floor(rng() * ownedLineIds.length)] ?? ownedLineIds[0];
      const lineName = getLineName(lineId);
      const goal = clampInt(1 + rng() * 2, 1, 3);
      return {
        type: "party-etymon",
        goal,
        lineId,
        lineName,
        label: `${lineName}を入れて${goal}回正解`,
      };
    },
  },
  {
    type: "party-level",
    build: ({ level, rng, partyMaxLevel }) => {
      if (partyMaxLevel <= 1) return null;
      // 現在の手持ちで達成可能なレベルに抑える（達成不能ミッションを積まない）
      const minLevel = clampInt(
        Math.min(level, partyMaxLevel) * (0.6 + rng() * 0.4),
        2,
        partyMaxLevel,
      );
      const goal = clampInt(1 + rng() * 2, 1, 3);
      return {
        type: "party-level",
        goal,
        minLevel,
        label: `Lv.${minLevel}以上を入れて${goal}回正解`,
      };
    },
  },
];

/**
 * 出現エティモンに積むミッション一式を生成する。
 * 挑戦数ミッションを土台に、レベルに応じた数だけ多様なミッションを重ねる。
 */
export function generateMissions({
  level,
  ownedLineIds = [],
  getLineName = (lineId) => lineId,
  partyMaxLevel = 0,
  rng = Math.random,
}: GenerateMissionsOptions): Mission[] {
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  const count = getMissionCountForLevel(safeLevel);
  const missions: Mission[] = [];

  // 土台ミッション: 挑戦数（正誤問わず。プレイし続けること自体が進行になる）
  const attemptGoal = clampInt(8 + safeLevel * 0.8, 8, 40);
  missions.push({
    id: "m-attempts",
    type: "attempts",
    label: `問題に${attemptGoal}回挑戦`,
    goal: attemptGoal,
    progress: 0,
    done: false,
  });

  const pool = [...MISSION_BLUEPRINTS];
  // Fisher–Yates シャッフルで重複なくランダムに選ぶ
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  for (const blueprint of pool) {
    if (missions.length >= count) break;
    const built = blueprint.build({
      level: safeLevel,
      rng,
      ownedLineIds,
      getLineName,
      partyMaxLevel,
    });
    if (!built) continue;
    missions.push({
      ...built,
      id: `m-${built.type}`,
      progress: 0,
      done: false,
    });
  }

  return missions;
}

/**
 * 1問の回答結果をミッション群に反映する。
 * 返り値の completedNow には今回の回答で達成されたミッションが入る。
 */
export function applyAnswerToMissions(
  missions: Mission[],
  event: MissionAnswerEvent,
): { missions: Mission[]; completedNow: Mission[] } {
  const completedNow: Mission[] = [];

  const next = missions.map((mission) => {
    if (mission.done) return mission;

    let progress = mission.progress;
    switch (mission.type) {
      case "attempts":
        progress += 1;
        break;
      case "weak-word":
        if (event.correct && event.wasWeakWord) progress += 1;
        break;
      case "new-word":
        if (event.correct && event.wasNewWord) progress += 1;
        break;
      case "streak":
        // 連続正解は「その時点の最高到達」を進捗として保持する
        progress = Math.max(progress, event.streak);
        break;
      case "party-etymon":
        if (
          event.correct &&
          mission.lineId &&
          event.partyLineIds.includes(mission.lineId)
        ) {
          progress += 1;
        }
        break;
      case "party-level":
        if (
          event.correct &&
          typeof mission.minLevel === "number" &&
          event.partyMaxLevel >= mission.minLevel
        ) {
          progress += 1;
        }
        break;
    }

    if (progress === mission.progress) return mission;
    const done = progress >= mission.goal;
    const updated = { ...mission, progress: Math.min(progress, mission.goal), done };
    if (done) completedNow.push(updated);
    return updated;
  });

  return { missions: next, completedNow };
}

export function areAllMissionsDone(missions: Mission[]): boolean {
  return missions.length > 0 && missions.every((mission) => mission.done);
}

/** localStorage 復元用。壊れたデータは捨てて null を返す */
export function normalizeMission(raw: unknown): Mission | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const goal = Number(data.goal);
  const progress = Number(data.progress);
  if (typeof data.id !== "string" || typeof data.label !== "string") return null;
  if (!Number.isFinite(goal) || goal <= 0) return null;
  const validTypes: MissionType[] = [
    "attempts",
    "weak-word",
    "new-word",
    "streak",
    "party-etymon",
    "party-level",
  ];
  if (!validTypes.includes(data.type as MissionType)) return null;
  const safeProgress = Number.isFinite(progress)
    ? Math.max(0, Math.min(progress, goal))
    : 0;
  return {
    id: data.id,
    type: data.type as MissionType,
    label: data.label,
    goal: Math.floor(goal),
    progress: Math.floor(safeProgress),
    done: Boolean(data.done) || safeProgress >= goal,
    lineId: typeof data.lineId === "string" ? data.lineId : undefined,
    lineName: typeof data.lineName === "string" ? data.lineName : undefined,
    minLevel: Number.isFinite(Number(data.minLevel))
      ? Number(data.minLevel)
      : undefined,
  };
}
