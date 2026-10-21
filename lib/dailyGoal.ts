// 1日の目標（何セット解いたか）のロジック。
// UI やストレージから切り離した純粋関数として実装し、テスト可能にしている。
//
// 「今日はどこまでやれば勝ちか」が見えないと、始めるきっかけも
// やめどきも曖昧になる。ゴールを小さなセット数で決めて、到達を見せる。

import { GAME } from "./constants";

/** 日付キー（ローカルタイムゾーンの "YYYY-MM-DD"）→ その日に解き終えたセット数 */
export type DailySetsMap = Record<string, number>;

/** 保持する日数。今日の数しか使わないので短くてよい */
const HISTORY_DAYS = 14;

function isDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

/** 不正な保存値を安全な DailySetsMap へ正規化する。 */
export function normalizeDailySets(raw: unknown): DailySetsMap {
  if (!raw || typeof raw !== "object") return {};
  const result: DailySetsMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isDateKey(key)) continue;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) continue;
    result[key] = Math.floor(value);
  }
  return result;
}

/** 目標セット数を範囲内の整数へ丸める。 */
export function clampDailyGoal(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return GAME.DAILY_GOAL_DEFAULT;
  return Math.min(GAME.DAILY_GOAL_MAX, Math.max(GAME.DAILY_GOAL_MIN, Math.round(n)));
}

/** 今日1セット解き終えたことを記録する。古い日付は切り捨てる。 */
export function recordSetCompleted(map: DailySetsMap, todayKey: string): DailySetsMap {
  const normalized = normalizeDailySets(map);
  const [y, m, d] = todayKey.split("-").map(Number);
  const cutoff = new Date(Date.UTC(y, m - 1, d - HISTORY_DAYS, 12)).toISOString().slice(0, 10);
  const result: DailySetsMap = {};
  for (const [key, value] of Object.entries(normalized)) {
    if (key >= cutoff) result[key] = value;
  }
  result[todayKey] = (normalized[todayKey] ?? 0) + 1;
  return result;
}

/** 今日解き終えたセット数。 */
export function getTodaySets(map: DailySetsMap, todayKey: string): number {
  return normalizeDailySets(map)[todayKey] ?? 0;
}
