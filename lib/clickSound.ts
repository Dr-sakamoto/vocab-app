/**
 * ボタン押下時の「カチャッ」というメカニカルなクリック音をWeb Audio APIで合成する。
 * 音声ファイルを持たないので読み込み待ちがなく、押した瞬間に必ず鳴る。
 * AudioContextはユーザー操作（pointerdown）内で遅延生成するため自動再生制限に触れない。
 */

import { SOUND, STORAGE_KEYS } from "./constants";
import { touchSetting } from "./settings";
import storage from "./storage";

let audioContext: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let soundVolume = storage.get<number>(STORAGE_KEYS.SOUND_VOLUME, SOUND.DEFAULT_VOLUME);

export function getSoundVolume(): number {
  return soundVolume;
}

/**
 * 同期で受け取った音量を反映する。保存と変更時刻は lib/settings.ts が持つので、
 * ここではモジュールが抱えている値だけを差し替える。
 */
export function adoptSoundVolume(volume: number): void {
  soundVolume = Math.min(SOUND.MAX_VOLUME, Math.max(SOUND.MIN_VOLUME, volume));
}

/** ユーザー操作による変更。変更時刻を残し、他端末との合流で新しい方が勝つようにする */
export function setSoundVolume(volume: number): void {
  adoptSoundVolume(volume);
  storage.set(STORAGE_KEYS.SOUND_VOLUME, soundVolume);
  touchSetting("soundVolume");
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;
  type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  audioContext = new Ctor();
  return audioContext;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 0.08);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

/** 「カ」「チャ」の2発。バンドパスを通したノイズバーストを短く減衰させる */
function playBurst(
  ctx: AudioContext,
  startAt: number,
  frequency: number,
  peakGain: number,
  decaySeconds: number,
) {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 7;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peakGain, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + decaySeconds);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(startAt);
  source.stop(startAt + decaySeconds + 0.01);
}

export function playClickSound(): void {
  if (soundVolume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const now = ctx.currentTime;
    playBurst(ctx, now, 3400, 0.1 * soundVolume, 0.03); // カ
    playBurst(ctx, now + 0.05, 2100, 0.14 * soundVolume, 0.05); // チャ
  } catch {
    /* 効果音の失敗でゲームを止めない */
  }
}
