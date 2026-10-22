// 進捗欄（ドーナツ＋毎日の伸び率）用の日次スナップショット。
// UI やストレージから切り離した純粋関数として実装し、テスト可能にしている。
//
// word_stats は累積の正解/不正解数しか持たず、「いつ何語が定着したか」の
// 履歴は無い。そこで日付キーごとに「その日時点で定着している語数」を
// 1つだけ記録する軽量なマップを別途持つ（daily_streak と同じ発想）。

import { toDateKey } from "./streak";

/** 日付キー（ローカルタイムゾーンの "YYYY-MM-DD"）→ その日時点の定着語数 */
export type DailyProgressMap = Record<string, number>;

export const EMPTY_DAILY_PROGRESS: DailyProgressMap = {};

/** 保持する履歴の日数。これより古い記録は記録・マージのたびに切り捨てる */
const HISTORY_DAYS = 60;

function isDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

/** 不正な保存値を安全な DailyProgressMap へ正規化する。 */
export function normalizeDailyProgress(raw: unknown): DailyProgressMap {
  if (!raw || typeof raw !== "object") return {};
  const result: DailyProgressMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isDateKey(key)) continue;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) continue;
    result[key] = Math.floor(value);
  }
  return result;
}

/** 日付キーから days 日ずらした日付キー（ローカルタイムゾーン）。 */
function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** todayKey から HISTORY_DAYS 日より前の記録を切り捨てる。 */
function pruneDailyProgress(map: DailyProgressMap, todayKey: string): DailyProgressMap {
  const cutoff = shiftDateKey(todayKey, -HISTORY_DAYS);
  const result: DailyProgressMap = {};
  for (const [key, value] of Object.entries(map)) {
    if (key >= cutoff) result[key] = value;
  }
  return result;
}

/**
 * 今日時点の定着語数を記録する。
 * 同じ日に何度セットを終えても、その日の最後の値で上書きする
 * （日ごとのスナップショットなので、1日の途中経過は残さない）。
 */
export function recordDailyProgress(
  map: DailyProgressMap,
  todayKey: string,
  masteredCount: number,
): DailyProgressMap {
  const normalized = normalizeDailyProgress(map);
  if (normalized[todayKey] === masteredCount) return map;
  return pruneDailyProgress({ ...normalized, [todayKey]: masteredCount }, todayKey);
}

/**
 * 端末をまたいだ日次記録を合流させる。
 *
 * 同じ日の記録が両端末にあれば、値が大きい方（より学習が進んでいる方）を
 * 残す。日ごとのスナップショットは「その日の終わりの状態」を指すので、
 * 2端末で並行して進めた場合はより進んでいた方の値を残すのが自然。
 */
export function mergeDailyProgress(
  rawA: unknown,
  rawB: unknown,
): DailyProgressMap {
  const a = normalizeDailyProgress(rawA);
  const b = normalizeDailyProgress(rawB);
  const merged: DailyProgressMap = { ...a };
  for (const [key, value] of Object.entries(b)) {
    merged[key] = Math.max(merged[key] ?? 0, value);
  }
  const todayKey = Object.keys(merged).sort().pop();
  return todayKey ? pruneDailyProgress(merged, todayKey) : merged;
}

export interface DailyGainPoint {
  /** ローカルタイムゾーンの日付キー */
  date: string;
  /** その日時点の定着語数（記録が無い日は直近の既知の値を引き継ぐ） */
  total: number;
  /** 前日からの増減。記録が無い日、または最初の1日は 0 */
  gain: number;
}

/**
 * todayKey を含む直近 days 日ぶんの推移を返す（古い日付が先頭）。
 *
 * 記録が無い日（プレイしなかった日）は直前の既知の値をそのまま引き継ぎ、
 * 伸びは 0 として扱う。歯抜けのグラフにせず「その日は増減が無かった」と
 * 読めるようにするため。
 */
export function getDailyGains(
  map: DailyProgressMap,
  todayKey: string,
  days = 14,
): DailyGainPoint[] {
  const normalized = normalizeDailyProgress(map);
  const points: DailyGainPoint[] = [];
  let prevTotal: number | null = null;

  for (let i = days - 1; i >= 0; i -= 1) {
    const key = shiftDateKey(todayKey, -i);
    const recorded = normalized[key];
    const total: number = typeof recorded === "number" ? recorded : (prevTotal ?? 0);
    const gain = prevTotal === null ? 0 : total - prevTotal;
    points.push({ date: key, total, gain });
    prevTotal = total;
  }

  return points;
}

export interface CalendarDay {
  /** 日付キー。今日より後のマス（最終週の残り）は null */
  date: string | null;
  /** その日にセットを1つ以上解き終えたか（日次記録があるか） */
  played: boolean;
  /** 前日からの定着語数の伸び。記録の無い日は 0 */
  gain: number;
}

/**
 * 学習カレンダー用に、直近 weeks 週ぶんを月曜始まりの週ごとに並べる
 * （古い週が先頭、各週は月〜日の7マス）。
 *
 * 日次記録はセットを解き終えたときにだけ付くので、記録がある日＝学習した日。
 * 「埋まっていくマス」は棒グラフより続けたくなる。HISTORY_DAYS（60日）より
 * 古い記録は残っていないので、weeks は 8 までにしておく。
 */
export function getActivityCalendar(
  map: DailyProgressMap,
  todayKey: string,
  weeks = 8,
): CalendarDay[][] {
  const normalized = normalizeDailyProgress(map);
  const [y, m, d] = todayKey.split("-").map(Number);
  const today = new Date(y, m - 1, d);
  // 月曜=0 … 日曜=6
  const weekday = (today.getDay() + 6) % 7;
  const totalDays = (weeks - 1) * 7 + weekday + 1;
  const gains = getDailyGains(map, todayKey, totalDays + 1).slice(1);

  const result: CalendarDay[][] = [];
  for (let w = 0; w < weeks; w += 1) {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i += 1) {
      const point = gains[w * 7 + i];
      week.push(
        point
          ? { date: point.date, played: point.date in normalized, gain: point.gain }
          : { date: null, played: false, gain: 0 },
      );
    }
    result.push(week);
  }
  return result;
}
