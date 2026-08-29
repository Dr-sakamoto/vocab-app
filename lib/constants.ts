export const GAME = {
  PLAY_LIMIT: 10,
  INITIAL_POOL_SIZE: 113,
  UNLOCK_ACCURACY: 0.8,
  UNLOCK_STEP: 30,
  PERFECT_UNLOCK_STEP: 50,
} as const;

export const SOUND = {
  DEFAULT_VOLUME: 0.7,
  MIN_VOLUME: 0,
  MAX_VOLUME: 1,
} as const;

export const FLASH = {
  DEFAULT_SPEED_SEC: 1.0,
  MIN_SPEED_SEC: 0.8,
  MAX_SPEED_SEC: 2.0,
  /**
   * 苦手フラッシュ：wrong数がこの値以上で、かつまだ定着し直していない語を
   * 出題範囲に含める（スライダーで調節）。定着の判定は hasRecoveredFromMistakes。
   */
  MISTAKE_THRESHOLD_MIN: 1,
  MISTAKE_THRESHOLD_MAX: 5,
  MISTAKE_THRESHOLD_DEFAULT: 2,
} as const;

export const XP = {
  BASE_PER_CORRECT: 20,
  WEAKNESS_PER_WRONG: 30,
  WEAKNESS_CAP: 80,
  NEW_WORD: 50,
  NET_RISE: 40,
} as const;

export const STORAGE_KEYS = {
  PROGRESS: "vocab-progress",
  POOL_SIZE: "vocab-active-pool-size",
  STREAK: "vocab-daily-streak",
  SOUND_VOLUME: "vocab-sound-volume",
  PRONUNCIATION_ENABLED: "vocab-pronunciation-enabled",
  PRONUNCIATION_VOLUME: "vocab-pronunciation-volume",
  FLASH_SPEED: "vocab-flash-speed",
  MISTAKE_THRESHOLD: "vocab-mistake-threshold",
  FLASH_PROGRESS: "vocab-flash-progress",
  SYNC_BASE: "vocab-sync-base",
} as const;

export const BUTTON_CLASSES = {
  PRIMARY:
    "inline-flex w-full justify-center rounded-xl bg-zinc-900 px-5 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-40 transition sm:w-auto sm:text-sm",
  SECONDARY:
    "inline-flex w-full justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-40 transition sm:w-auto sm:text-sm",
} as const;
