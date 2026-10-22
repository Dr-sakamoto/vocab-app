// 試験日までの残り日数と、収録語を定着させ切るまでのペースの見積もり。
// UI やストレージから切り離した純粋関数として実装し、テスト可能にしている。
//
// 「準1級に受かる」は遠すぎて毎日の行動に落ちない。試験日と今のペースから
// 「あと何日」「1日何語」という手元の数字に変換して見せる。

import { DailyGainPoint } from "./dailyProgress";

export interface ExamPlan {
  /** 試験日まであと何日（当日は0、過ぎていれば負） */
  daysLeft: number;
  /** まだ定着していない語数 */
  remaining: number;
  /** 試験日までに残りを定着させ切るのに要る1日あたりの語数（切り上げ）。試験日を過ぎていれば null */
  requiredPerDay: number | null;
  /** 直近の1日あたりの定着ペース（語/日） */
  pacePerDay: number;
  /** 今のペースで残りを定着させ切る日（"YYYY-MM-DD"）。ペースが0以下なら null */
  projectedDate: string | null;
  /** 今のペースで試験日に間に合うか */
  onTrack: boolean;
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function keyToUtcNoon(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d, 12, 0, 0);
}

function addDays(key: string, days: number): string {
  return new Date(keyToUtcNoon(key) + days * 86_400_000).toISOString().slice(0, 10);
}

/** 保存値を試験日キーへ正規化する。不正なら null。 */
export function normalizeExamDate(raw: unknown): string | null {
  return isDateKey(raw) ? raw : null;
}

/**
 * 直近の定着ペース（語/日）。期間の最初と最後の定着語数の差を日数で割る。
 * 減った日も含めた正味の伸びなので、取りこぼしも正直に反映される。
 */
export function getPacePerDay(points: DailyGainPoint[]): number {
  if (points.length < 2) return 0;
  const first = points[0];
  const last = points[points.length - 1];
  return (last.total - first.total) / (points.length - 1);
}

export function buildExamPlan({
  examDate,
  todayKey,
  retained,
  totalWords,
  pacePerDay,
}: {
  examDate: string;
  todayKey: string;
  retained: number;
  totalWords: number;
  pacePerDay: number;
}): ExamPlan {
  const daysLeft = Math.round((keyToUtcNoon(examDate) - keyToUtcNoon(todayKey)) / 86_400_000);
  const remaining = Math.max(0, totalWords - retained);
  const requiredPerDay =
    daysLeft > 0 ? Math.ceil(remaining / daysLeft) : daysLeft === 0 ? remaining : null;
  const projectedDate =
    remaining === 0
      ? todayKey
      : pacePerDay > 0
        ? addDays(todayKey, Math.ceil(remaining / pacePerDay))
        : null;
  const onTrack = projectedDate !== null && projectedDate <= examDate;
  return { daysLeft, remaining, requiredPerDay, pacePerDay, projectedDate, onTrack };
}
