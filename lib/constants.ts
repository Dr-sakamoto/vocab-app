export const GAME = {
  PLAY_LIMIT: 10,
  INITIAL_POOL_SIZE: 113,
  UNLOCK_ACCURACY: 0.8,
  UNLOCK_STEP: 30,
  PERFECT_UNLOCK_STEP: 50,
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
  SOUND_ENABLED: "vocab-sound-enabled",
} as const;

export const BUTTON_CLASSES = {
  PRIMARY:
    "inline-flex w-full justify-center rounded-xl bg-zinc-900 px-5 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-40 transition sm:w-auto sm:text-sm",
  SECONDARY:
    "inline-flex w-full justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-40 transition sm:w-auto sm:text-sm",
} as const;
