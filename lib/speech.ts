/**
 * 出題中の英単語をWeb Speech API（SpeechSynthesis）で読み上げる。
 * 音声ファイルを持たないブラウザ内蔵TTSなので、追加の依存やアセットが不要。
 */

import { STORAGE_KEYS } from "./constants";
import storage from "./storage";

let pronunciationEnabled = storage.get(STORAGE_KEYS.PRONUNCIATION_ENABLED, true);

export function isPronunciationEnabled(): boolean {
  return pronunciationEnabled;
}

export function setPronunciationEnabled(enabled: boolean): void {
  pronunciationEnabled = enabled;
  storage.set(STORAGE_KEYS.PRONUNCIATION_ENABLED, enabled);
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
