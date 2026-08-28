import { FLASH, STORAGE_KEYS } from "./constants";
import storage from "./storage";

/**
 * 端末間で持ち回る設定。
 *
 * 単語の進捗と違い、これらは「どちらが多いか」で合流できない。苦手フラッシュの
 * しきい値だけは出題範囲そのものを決めるので、端末ごとに違うと同じ苦手データでも
 * 出てくる単語が変わってしまう。残り2つは純粋な好みだが、置き場所と合流規則が
 * 同じなのでまとめて扱う。
 *
 * 音量（効果音・読み上げ）は意図的に対象外。PCのスピーカーと外出先のスマホでは
 * 適切な大きさが違い、端末ごとに決まっているべき設定なので同期しない。
 */
export interface AppSettings {
  pronunciationEnabled: boolean;
  flashSpeed: number;
  mistakeThreshold: number;
}

export type SettingKey = keyof AppSettings;

export const SETTING_KEYS: SettingKey[] = [
  "pronunciationEnabled",
  "flashSpeed",
  "mistakeThreshold",
];

export const DEFAULT_SETTINGS: AppSettings = {
  pronunciationEnabled: true,
  flashSpeed: FLASH.DEFAULT_SPEED_SEC,
  mistakeThreshold: FLASH.MISTAKE_THRESHOLD_DEFAULT,
};

/**
 * 同期する形。値と、項目ごとの最終変更時刻（epoch ミリ秒）を持つ。
 *
 * 時刻を設定ごとに持つのは、まとめて1つにすると「スマホでフラッシュ速度を変え、
 * PCで苦手のしきい値を変えた」ときに後から同期した方の変更だけが残り、もう
 * 片方が黙って巻き戻るため。項目ごとなら両方の変更が残る。
 * 一度も触っていない設定は時刻を持たない（＝相手が触っていれば必ず負ける）。
 */
export interface StoredSettings {
  values: AppSettings;
  updatedAt: Partial<Record<SettingKey, number>>;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  // Number(null) と Number("") は 0 になる。そのまま通すと「未設定」が
  // スライダーの最小値として保存され、フラッシュ速度が黙って最速に貼り付く。
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/** 保存値・同期で受け取った値を、その設定が取りうる範囲へ丸める */
export function clampSetting<K extends SettingKey>(key: K, value: unknown): AppSettings[K] {
  switch (key) {
    case "flashSpeed":
      return clampNumber(
        value,
        FLASH.MIN_SPEED_SEC,
        FLASH.MAX_SPEED_SEC,
        DEFAULT_SETTINGS.flashSpeed,
      ) as AppSettings[K];
    case "mistakeThreshold":
      return Math.round(
        clampNumber(
          value,
          FLASH.MISTAKE_THRESHOLD_MIN,
          FLASH.MISTAKE_THRESHOLD_MAX,
          DEFAULT_SETTINGS.mistakeThreshold,
        ),
      ) as AppSettings[K];
    default:
      // pronunciationEnabled。未設定（undefined）は既定の true に倒す
      return (value === undefined ? DEFAULT_SETTINGS.pronunciationEnabled : value === true) as
        AppSettings[K];
  }
}

/** クラウドから戻ってきた値を StoredSettings として安全に読む */
export function normalizeStoredSettings(raw: unknown): StoredSettings | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const stored = raw as { values?: unknown; updatedAt?: unknown };
  const rawValues = (stored.values ?? {}) as Record<string, unknown>;
  const rawTimes = (stored.updatedAt ?? {}) as Record<string, unknown>;
  if (typeof rawValues !== "object" || Array.isArray(rawValues)) return null;

  const values = { ...DEFAULT_SETTINGS };
  const updatedAt: Partial<Record<SettingKey, number>> = {};
  for (const key of SETTING_KEYS) {
    if (rawValues[key] !== undefined) {
      values[key] = clampSetting(key, rawValues[key]) as never;
    }
    const time = Number(rawTimes?.[key]);
    if (Number.isFinite(time) && time > 0) updatedAt[key] = time;
  }
  return { values, updatedAt };
}

/**
 * 端末をまたいだ設定を項目ごとに合流させる。
 *
 * 変更時刻の新しい側を採り、同点・どちらも未変更ならローカルを残す
 * （フラッシュ進捗の合流と同じ扱い）。
 */
export function mergeSettings(local: unknown, remote: unknown): StoredSettings | null {
  const here = normalizeStoredSettings(local);
  const there = normalizeStoredSettings(remote);
  if (!here) return there;
  if (!there) return here;

  const values = { ...here.values };
  const updatedAt = { ...here.updatedAt };
  for (const key of SETTING_KEYS) {
    const mine = here.updatedAt[key] ?? 0;
    const theirs = there.updatedAt[key] ?? 0;
    if (theirs > mine) {
      values[key] = there.values[key] as never;
      updatedAt[key] = theirs;
    }
  }
  return { values, updatedAt };
}

/**
 * 設定を localStorage から読む。
 *
 * 値は従来どおり設定ごとのキーに置いたまま（clickSound / speech が
 * モジュール読み込み時にそこから直接読む）で、変更時刻だけを1つのキーに
 * まとめて持つ。
 */
export function readStoredSettings(): StoredSettings {
  const rawTimes = storage.get<Record<string, unknown> | null>(
    STORAGE_KEYS.SETTINGS_UPDATED_AT,
    null,
  );
  return (
    normalizeStoredSettings({
      values: {
        pronunciationEnabled: storage.get(
          STORAGE_KEYS.PRONUNCIATION_ENABLED,
          DEFAULT_SETTINGS.pronunciationEnabled,
        ),
        flashSpeed: storage.get(STORAGE_KEYS.FLASH_SPEED, DEFAULT_SETTINGS.flashSpeed),
        mistakeThreshold: storage.get(
          STORAGE_KEYS.MISTAKE_THRESHOLD,
          DEFAULT_SETTINGS.mistakeThreshold,
        ),
      },
      updatedAt: rawTimes ?? {},
    }) ?? { values: { ...DEFAULT_SETTINGS }, updatedAt: {} }
  );
}

/** 合流後の設定を localStorage へ書き戻す */
export function writeStoredSettings(settings: StoredSettings): void {
  storage.set(STORAGE_KEYS.PRONUNCIATION_ENABLED, settings.values.pronunciationEnabled);
  storage.set(STORAGE_KEYS.FLASH_SPEED, settings.values.flashSpeed);
  storage.set(STORAGE_KEYS.MISTAKE_THRESHOLD, settings.values.mistakeThreshold);
  storage.set(STORAGE_KEYS.SETTINGS_UPDATED_AT, settings.updatedAt);
}

/**
 * その設定を「今この端末で変更した」と記録する。
 *
 * 値そのものの保存は従来どおり各設定のキーへ行う。ここが呼ばれない設定は
 * 時刻を持たないままなので、相手の端末が触っていればそちらが採られる。
 */
export function touchSetting(key: SettingKey, now: number = Date.now()): void {
  const times = storage.get<Record<string, unknown> | null>(
    STORAGE_KEYS.SETTINGS_UPDATED_AT,
    null,
  );
  storage.set(STORAGE_KEYS.SETTINGS_UPDATED_AT, { ...(times ?? {}), [key]: now });
}
