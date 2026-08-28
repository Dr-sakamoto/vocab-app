/**
 * 出題中の英単語をWeb Speech API（SpeechSynthesis）で読み上げる。
 * 音声ファイルを持たないブラウザ内蔵TTSなので、追加の依存やアセットが不要。
 */

import { STORAGE_KEYS } from "./constants";
import { touchSetting } from "./settings";
import storage from "./storage";

const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const DEFAULT_VOLUME = 1;

let pronunciationEnabled = storage.get(STORAGE_KEYS.PRONUNCIATION_ENABLED, true);
let pronunciationVolume = storage.get<number>(STORAGE_KEYS.PRONUNCIATION_VOLUME, DEFAULT_VOLUME);

export function isPronunciationEnabled(): boolean {
  return pronunciationEnabled;
}

/**
 * 同期で受け取った設定を反映する。保存と変更時刻は lib/settings.ts が持つので、
 * ここではモジュールが抱えている値だけを差し替える。
 */
export function adoptPronunciationEnabled(enabled: boolean): void {
  pronunciationEnabled = enabled;
}

/** ユーザー操作による変更。変更時刻を残し、他端末との合流で新しい方が勝つようにする */
export function setPronunciationEnabled(enabled: boolean): void {
  adoptPronunciationEnabled(enabled);
  storage.set(STORAGE_KEYS.PRONUNCIATION_ENABLED, enabled);
  touchSetting("pronunciationEnabled");
}

export function getPronunciationVolume(): number {
  return pronunciationVolume;
}

export function setPronunciationVolume(volume: number): void {
  const clamped = Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, volume));
  pronunciationVolume = clamped;
  storage.set(STORAGE_KEYS.PRONUNCIATION_VOLUME, clamped);
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** 読み上げを開始できたら true。オフ設定・非対応環境・空文字では何もせず false を返す */
export function speakEnglishWord(word: string): boolean {
  const text = word.trim();
  if (!text || !pronunciationEnabled || !canSpeak()) return false;

  try {
    window.speechSynthesis.cancel(); // 前の読み上げが残っていたら止めてから話す
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.volume = pronunciationVolume;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false; // 読み上げの失敗でゲームを止めない
  }
}

export function stopSpeaking(): void {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* no-op */
  }
}
