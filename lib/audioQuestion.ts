import { AUDIO_ONLY } from "./constants";

/**
 * 音だけの出題：単語を見せず、読み上げだけを聞いて和訳を打つ。
 *
 * 英検のリスニングでは、語を目で見ずに音だけで意味が取れる必要がある。
 * 綴りを見て分かる語でも、音で聞くと出てこないことは多い。
 * 記述式のまま出題の入り口だけを音に変えるので、思い出す負荷は保たれる。
 *
 * まだ目でも覚えきれていない語を音で出すと手が止まるだけなので、
 * 定着がある程度進んだ語（AUDIO_ONLY.MIN_LEVEL 以上）に限り、
 * 1セットに AUDIO_ONLY.MAX_PER_SET 問までにとどめる。
 */
export function pickAudioOnlySlots(
  levels: number[],
  random: () => number = Math.random,
): boolean[] {
  let remaining: number = AUDIO_ONLY.MAX_PER_SET;
  return levels.map((level) => {
    if (remaining <= 0 || level < AUDIO_ONLY.MIN_LEVEL) return false;
    if (random() >= AUDIO_ONLY.RATE) return false;
    remaining -= 1;
    return true;
  });
}
