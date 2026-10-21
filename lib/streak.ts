// 毎日ストリーク（連続プレイ日数）のロジック。
// UI やストレージから切り離した純粋関数として実装し、テスト可能にしている。

export interface StreakState {
  /** 現在の連続プレイ日数。 */
  current: number;
  /** これまでの最長連続日数。 */
  longest: number;
  /** 最後にプレイした日（ローカル日付キー "YYYY-MM-DD"）。未プレイは null。 */
  lastPlayedDate: string | null;
  /**
   * 最後に「おやすみ（ストリークフリーズ）」で埋めた日。一度も使っていなければ
   * キーごと持たない（既存の保存値・同期データの形を変えないため）。
   */
  lastFreezeDate?: string;
}

/**
 * おやすみ（ストリークフリーズ）を使い直せるまでの日数。
 *
 * 1日休んだだけで連続が0に戻ると、「もう途切れたからいいや」で
 * そのまま離れてしまう（what-the-hell効果）。週に1日までは休んでも
 * 連続を保ち、戻ってくる理由を残しておく。
 */
export const STREAK_FREEZE_INTERVAL_DAYS = 7;

export interface StreakOptions {
  /** 1日だけの空白をおやすみで埋めるか。既定は従来どおり埋めない */
  allowFreeze?: boolean;
}

export const EMPTY_STREAK: StreakState = {
  current: 0,
  longest: 0,
  lastPlayedDate: null,
};

/** ローカルタイムゾーンの日付を "YYYY-MM-DD" のキーへ変換する。 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 日付キーを正午の UTC として解釈することで、DST（夏時間）の境界でも
// 日数差が 1 日ずれないようにする。
function keyToUtcNoon(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d, 12, 0, 0);
}

/** fromKey から toKey までの経過日数（同日なら 0）。 */
function dayDiff(fromKey: string, toKey: string): number {
  const ms = keyToUtcNoon(toKey) - keyToUtcNoon(fromKey);
  return Math.round(ms / 86_400_000);
}

/** dateKey の前日の日付キー。 */
function previousDateKey(key: string): string {
  const date = new Date(keyToUtcNoon(key) - 86_400_000);
  return date.toISOString().slice(0, 10);
}

/** missedKey の空白を、いまおやすみで埋められるか。 */
function canFreeze(s: StreakState, missedKey: string): boolean {
  if (s.lastFreezeDate === undefined) return true;
  return dayDiff(s.lastFreezeDate, missedKey) >= STREAK_FREEZE_INTERVAL_DAYS;
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** 不正な保存値を安全な StreakState へ正規化する。 */
export function normalizeStreak(raw: unknown): StreakState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STREAK };
  const r = raw as Partial<StreakState>;
  const current =
    typeof r.current === "number" && r.current >= 0 ? Math.floor(r.current) : 0;
  const longest =
    typeof r.longest === "number" && r.longest >= 0 ? Math.floor(r.longest) : 0;
  const lastPlayedDate = isDateKey(r.lastPlayedDate) ? r.lastPlayedDate : null;
  const normalized: StreakState = {
    current,
    longest: Math.max(longest, current),
    lastPlayedDate,
  };
  if (isDateKey(r.lastFreezeDate)) normalized.lastFreezeDate = r.lastFreezeDate;
  return normalized;
}

/**
 * 今日プレイしたことを記録し、更新後のストリークを返す。
 * - 同じ日に複数回プレイしても 1 日としてカウントする（重複加算しない）。
 * - 前日にプレイしていれば連続日数を +1。
 * - 2 日以上空いていれば 1 にリセット。
 * - allowFreeze のときは、ちょうど1日だけの空白をおやすみで埋めて連続を保つ
 *   （STREAK_FREEZE_INTERVAL_DAYS 日に1回まで）。埋めた日は数に入れない。
 */
export function recordPlay(
  state: StreakState,
  todayKey: string,
  { allowFreeze = false }: StreakOptions = {},
): StreakState {
  const s = normalizeStreak(state);
  if (s.lastPlayedDate === todayKey) {
    return s; // 本日分は記録済み。
  }

  const diff = s.lastPlayedDate === null ? null : dayDiff(s.lastPlayedDate, todayKey);
  const missedKey = previousDateKey(todayKey);
  const frozen = allowFreeze && diff === 2 && s.current > 0 && canFreeze(s, missedKey);

  let nextCurrent: number;
  if (diff === 1 || frozen) {
    nextCurrent = s.current + 1;
  } else {
    nextCurrent = 1;
  }

  const next: StreakState = {
    current: nextCurrent,
    longest: Math.max(s.longest, nextCurrent),
    lastPlayedDate: todayKey,
  };
  const lastFreezeDate = frozen ? missedKey : s.lastFreezeDate;
  if (lastFreezeDate !== undefined) next.lastFreezeDate = lastFreezeDate;
  return next;
}

/**
 * 表示用の現在ストリーク。保存値を変更せずに、途切れている場合は 0 を返す。
 * （今日でも昨日でもない日が最後のプレイなら連続は途切れている）
 */
export function getDisplayStreak(
  state: StreakState,
  todayKey: string,
  { allowFreeze = false }: StreakOptions = {},
): number {
  const s = normalizeStreak(state);
  if (s.lastPlayedDate === null) return 0;
  const diff = dayDiff(s.lastPlayedDate, todayKey);
  if (diff === 0 || diff === 1) return s.current;
  // 昨日を休んだだけなら、今日プレイすればおやすみで埋まる。まだ途切れていない
  if (allowFreeze && diff === 2 && canFreeze(s, previousDateKey(todayKey))) return s.current;
  return 0;
}

/**
 * 次におやすみが使える日。使えるならその日付キー、今日すでに使える状態なら
 * todayKey を返す（表示用）。
 */
export function getNextFreezeDate(state: StreakState, todayKey: string): string {
  const s = normalizeStreak(state);
  if (s.lastFreezeDate === undefined) return todayKey;
  const [y, m, d] = s.lastFreezeDate.split("-").map(Number);
  const available = new Date(Date.UTC(y, m - 1, d + STREAK_FREEZE_INTERVAL_DAYS, 12))
    .toISOString()
    .slice(0, 10);
  return available > todayKey ? available : todayKey;
}

/**
 * 端末をまたいだストリークを合流させる。
 *
 * 日ごとのプレイ履歴は保存していない（持っているのは最終プレイ日と連続日数
 * だけ）ので、2端末の状態から正確な連続日数を復元することはできない。
 * 「どちらかの端末でプレイした日はプレイした日」という前提に立ち、
 * 獲得済みの記録を取り落とさない側へ倒す。
 *
 * - 最終プレイ日は新しい方を残す
 * - 古い方の最終プレイ日がその前日なら、連続は端末をまたいで続いている
 *   （PCで月曜、スマホで火曜に続けた場合を途切れさせない）
 * - 最長記録は単純に大きい方
 */
export function mergeStreaks(rawA: unknown, rawB: unknown): StreakState {
  const a = normalizeStreak(rawA);
  const b = normalizeStreak(rawB);
  const longest = Math.max(a.longest, b.longest);
  // おやすみは端末をまたいで共有の1枠。新しく使ったほうを残す
  const freezes = [a.lastFreezeDate, b.lastFreezeDate].filter(isDateKey).sort();
  const lastFreezeDate = freezes[freezes.length - 1];

  if (a.lastPlayedDate === null) return normalizeStreak({ ...b, longest, lastFreezeDate });
  if (b.lastPlayedDate === null) return normalizeStreak({ ...a, longest, lastFreezeDate });

  // "YYYY-MM-DD" は辞書順＝日付順
  const [later, earlier] = a.lastPlayedDate >= b.lastPlayedDate ? [a, b] : [b, a];

  if (later.lastPlayedDate === earlier.lastPlayedDate) {
    return normalizeStreak({
      current: Math.max(later.current, earlier.current),
      longest,
      lastPlayedDate: later.lastPlayedDate,
      lastFreezeDate,
    });
  }

  const bridged =
    dayDiff(earlier.lastPlayedDate as string, later.lastPlayedDate as string) === 1
      ? earlier.current + 1
      : 0;

  return normalizeStreak({
    current: Math.max(later.current, bridged),
    longest,
    lastPlayedDate: later.lastPlayedDate,
    lastFreezeDate,
  });
}

/** 表示用に、本日プレイ済みかどうか。 */
export function hasPlayedToday(state: StreakState, todayKey: string): boolean {
  return normalizeStreak(state).lastPlayedDate === todayKey;
}
