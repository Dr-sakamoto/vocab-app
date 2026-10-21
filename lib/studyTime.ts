// セットの所要時間と、1日の学習時間の記録。
// UI やストレージから切り離した純粋関数として実装し、テスト可能にしている。
//
// 「1セットはすぐ終わる」と分かると始めやすく、時間の感覚がずれやすい人が
// 自分のやりすぎ・やらなすぎに気づく手がかりにもなる。

/** 日付キー（ローカルタイムゾーンの "YYYY-MM-DD"）→ その日の学習時間（ミリ秒） */
export type DailyTimeMap = Record<string, number>;

/**
 * 1セットとして数える時間の上限。途中で席を立って戻ってきたセットが
 * 何十分も積まれて、学習時間を水増ししないようにする。
 */
export const MAX_SET_DURATION_MS = 10 * 60_000;

const HISTORY_DAYS = 14;

function isDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

export function normalizeDailyTime(raw: unknown): DailyTimeMap {
  if (!raw || typeof raw !== "object") return {};
  const result: DailyTimeMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isDateKey(key)) continue;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) continue;
    result[key] = Math.floor(value);
  }
  return result;
}

/** 1セットの所要時間を、記録に使える値へ丸める（負や上限超えを除く）。 */
export function clampSetDuration(ms: number): number {
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.min(MAX_SET_DURATION_MS, Math.round(ms));
}

/** 今日の学習時間に1セットぶんを足す。古い日付は切り捨てる。 */
export function recordStudyTime(map: DailyTimeMap, todayKey: string, ms: number): DailyTimeMap {
  const normalized = normalizeDailyTime(map);
  const [y, m, d] = todayKey.split("-").map(Number);
  const cutoff = new Date(Date.UTC(y, m - 1, d - HISTORY_DAYS, 12)).toISOString().slice(0, 10);
  const result: DailyTimeMap = {};
  for (const [key, value] of Object.entries(normalized)) {
    if (key >= cutoff) result[key] = value;
  }
  result[todayKey] = (normalized[todayKey] ?? 0) + clampSetDuration(ms);
  return result;
}

export function getTodayTime(map: DailyTimeMap, todayKey: string): number {
  return normalizeDailyTime(map)[todayKey] ?? 0;
}

/** "1分42秒" / "42秒" */
export function formatSetDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}分${String(seconds).padStart(2, "0")}秒` : `${seconds}秒`;
}

/** "12分"。1分未満は "1分未満" */
export function formatDayTime(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  return minutes > 0 ? `${minutes}分` : "1分未満";
}
