// 週次目標（週に何日プレイしたか）のロジック。
// UI やストレージから切り離した純粋関数として実装し、テスト可能にしている。
//
// 毎日ストリークは1日休むと 0 に戻る。続けにくい人ほど、一度途切れると
// 「もういいや」で離れてしまう。週次目標は週のうち WEEKLY_GOAL.DAYS 日を
// 目標にして、残りの日は休んでも途切れないようにする。

import { WEEKLY_GOAL } from "./constants";
import { StreakState, normalizePlayedDates, normalizeStreak, toDateKey } from "./streak";

export interface WeeklyGoalStatus {
  /** 今週（月曜始まり）にプレイした日数 */
  daysThisWeek: number;
  /** 週の目標日数 */
  goal: number;
  /** 今週の目標を達成済みか */
  achievedThisWeek: boolean;
  /**
   * 目標を達成した週が何週続いているか。今週は達成した時点で数える。
   * 今週がまだ未達でも、週が終わるまでは途切れていない扱いにする。
   */
  weekStreak: number;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 日付キーから days 日ずらした日付キー（ローカルタイムゾーン） */
function shiftDateKey(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** その日を含む週の月曜日の日付キー */
export function weekStartKey(key: string): string {
  const daysSinceMonday = (parseDateKey(key).getDay() + 6) % 7;
  return shiftDateKey(key, -daysSinceMonday);
}

/**
 * 週次目標の集計に使うプレイ日の一覧を組み立てる。
 *
 * playedDates はこの機能を足してから記録し始めたもので、それ以前の
 * プレイ日を持たない。過去分は手元の記録から埋める：
 *   - 連続日数（current）ぶん、最終プレイ日から遡った日は確実にプレイしている
 *   - extraDates（日次の定着記録 dailyProgress のキー＝セットを解き終えた日）
 */
export function collectPlayedDates(
  rawStreak: unknown,
  extraDates: Iterable<string> = [],
): string[] {
  const streak: StreakState = normalizeStreak(rawStreak);
  const dates: string[] = [...(streak.playedDates ?? []), ...extraDates];
  if (streak.lastPlayedDate) {
    for (let i = 0; i < streak.current; i += 1) {
      dates.push(shiftDateKey(streak.lastPlayedDate, -i));
    }
  }
  return normalizePlayedDates(dates);
}

/** プレイ日の一覧から、今週の進み具合と連続達成週数を出す */
export function getWeeklyGoalStatus(
  playedDates: string[],
  todayKey: string,
  goal: number = WEEKLY_GOAL.DAYS,
): WeeklyGoalStatus {
  const daysByWeek = new Map<string, number>();
  for (const key of normalizePlayedDates(playedDates)) {
    if (key > todayKey) continue; // 端末の時計ずれで未来の日付が混ざっても数えない
    const week = weekStartKey(key);
    daysByWeek.set(week, (daysByWeek.get(week) ?? 0) + 1);
  }

  const thisWeek = weekStartKey(todayKey);
  const daysThisWeek = daysByWeek.get(thisWeek) ?? 0;
  const achievedThisWeek = daysThisWeek >= goal;

  let weekStreak = achievedThisWeek ? 1 : 0;
  for (
    let week = shiftDateKey(thisWeek, -7);
    (daysByWeek.get(week) ?? 0) >= goal;
    week = shiftDateKey(week, -7)
  ) {
    weekStreak += 1;
  }

  return { daysThisWeek, goal, achievedThisWeek, weekStreak };
}
