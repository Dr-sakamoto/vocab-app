import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SETTINGS,
  clampSetting,
  mergeSettings,
  normalizeStoredSettings,
} from "../lib/settings.js";
import { FLASH, SOUND } from "../lib/constants.js";

const T1 = Date.UTC(2026, 7, 1);
const T2 = Date.UTC(2026, 7, 2);

/** 値と変更時刻を1項目だけ持つ設定を作る */
function withSetting(key, value, at) {
  return {
    values: { ...DEFAULT_SETTINGS, [key]: value },
    updatedAt: at === undefined ? {} : { [key]: at },
  };
}

// ── 合流 ────────────────────────────────────────────────────────────────────

test("the more recently changed side wins per setting", () => {
  const local = withSetting("mistakeThreshold", 1, T1);
  const remote = withSetting("mistakeThreshold", 4, T2);

  assert.equal(mergeSettings(local, remote).values.mistakeThreshold, 4);
  assert.equal(mergeSettings(remote, local).values.mistakeThreshold, 4);
});

test("changes to different settings on two devices both survive", () => {
  // 設定ごとに時刻を持たない実装だと、後から同期した方の変更だけが残り
  // もう片方が黙って巻き戻る。
  const local = {
    values: { ...DEFAULT_SETTINGS, flashSpeed: 1.6 },
    updatedAt: { flashSpeed: T1 },
  };
  const remote = {
    values: { ...DEFAULT_SETTINGS, soundVolume: 0.2 },
    updatedAt: { soundVolume: T2 },
  };

  const merged = mergeSettings(local, remote);
  assert.equal(merged.values.flashSpeed, 1.6);
  assert.equal(merged.values.soundVolume, 0.2);
  assert.deepEqual(merged.updatedAt, { flashSpeed: T1, soundVolume: T2 });
});

test("a setting nobody touched stays on its default", () => {
  const merged = mergeSettings(withSetting("flashSpeed", 1.6, T1), withSetting("flashSpeed", 1.2, T2));
  assert.equal(merged.values.mistakeThreshold, DEFAULT_SETTINGS.mistakeThreshold);
  assert.equal(merged.updatedAt.mistakeThreshold, undefined);
});

test("an untouched device never overwrites a device that was changed", () => {
  // 変更時刻を持たない側は、相手が触っていれば必ず負ける。
  const untouched = withSetting("mistakeThreshold", DEFAULT_SETTINGS.mistakeThreshold);
  const changed = withSetting("mistakeThreshold", 5, T1);

  assert.equal(mergeSettings(untouched, changed).values.mistakeThreshold, 5);
  assert.equal(mergeSettings(changed, untouched).values.mistakeThreshold, 5);
});

test("the same change synced twice is stable", () => {
  const local = withSetting("flashSpeed", 1.4, T1);
  const once = mergeSettings(local, withSetting("flashSpeed", 1.4, T1));
  const twice = mergeSettings(once, once);

  assert.deepEqual(twice, once);
});

test("a tie keeps the local value", () => {
  const merged = mergeSettings(withSetting("soundVolume", 0.1, T1), withSetting("soundVolume", 0.9, T1));
  assert.equal(merged.values.soundVolume, 0.1);
});

test("merging against a missing side keeps the side that exists", () => {
  const local = withSetting("flashSpeed", 1.8, T1);
  assert.deepEqual(mergeSettings(local, null), local);
  assert.deepEqual(mergeSettings(null, local), local);
  assert.equal(mergeSettings(null, null), null);
});

// ── 受け取った値の正規化 ────────────────────────────────────────────────────

test("values outside the slider range are clamped, not trusted", () => {
  assert.equal(clampSetting("soundVolume", 99), SOUND.MAX_VOLUME);
  assert.equal(clampSetting("soundVolume", -3), SOUND.MIN_VOLUME);
  assert.equal(clampSetting("flashSpeed", 0.1), FLASH.MIN_SPEED_SEC);
  assert.equal(clampSetting("flashSpeed", 99), FLASH.MAX_SPEED_SEC);
  assert.equal(clampSetting("mistakeThreshold", 99), FLASH.MISTAKE_THRESHOLD_MAX);
  assert.equal(clampSetting("mistakeThreshold", 0), FLASH.MISTAKE_THRESHOLD_MIN);
});

test("the mistake threshold stays a whole number of wrong answers", () => {
  assert.equal(clampSetting("mistakeThreshold", 2.6), 3);
});

test("junk values fall back to the default instead of poisoning the setting", () => {
  assert.equal(clampSetting("soundVolume", "loud"), DEFAULT_SETTINGS.soundVolume);
  assert.equal(clampSetting("flashSpeed", null), DEFAULT_SETTINGS.flashSpeed);
  // Number(null) / Number("") は 0 になる。素通しするとスライダーの最小値に
  // 貼り付いてしまうので、数値として読めないものは既定へ倒す。
  assert.equal(clampSetting("flashSpeed", ""), DEFAULT_SETTINGS.flashSpeed);
  assert.equal(clampSetting("soundVolume", null), DEFAULT_SETTINGS.soundVolume);
  assert.equal(clampSetting("pronunciationEnabled", undefined), true);
  assert.equal(clampSetting("pronunciationEnabled", "yes"), false);
});

test("a row written before the settings column existed reads as untouched", () => {
  assert.equal(normalizeStoredSettings(null), null);
  assert.equal(normalizeStoredSettings("nope"), null);
  assert.equal(normalizeStoredSettings([]), null);
});

test("a partially filled row keeps defaults for what it does not carry", () => {
  const stored = normalizeStoredSettings({ values: { flashSpeed: 1.5 }, updatedAt: { flashSpeed: T1 } });

  assert.equal(stored.values.flashSpeed, 1.5);
  assert.equal(stored.values.soundVolume, DEFAULT_SETTINGS.soundVolume);
  assert.deepEqual(stored.updatedAt, { flashSpeed: T1 });
});

test("broken timestamps are dropped rather than treated as very old or very new", () => {
  const stored = normalizeStoredSettings({
    values: { flashSpeed: 1.5 },
    updatedAt: { flashSpeed: "yesterday", soundVolume: -1 },
  });

  assert.deepEqual(stored.updatedAt, {});
});

test("an out-of-range value from another device is clamped on the way in", () => {
  const remote = { values: { mistakeThreshold: 99 }, updatedAt: { mistakeThreshold: T2 } };
  const merged = mergeSettings(withSetting("mistakeThreshold", 2, T1), remote);

  assert.equal(merged.values.mistakeThreshold, FLASH.MISTAKE_THRESHOLD_MAX);
});
