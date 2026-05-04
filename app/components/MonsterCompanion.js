"use client";

import { getMonsterState } from "@/lib/monster";

/**
 * モンスターの現在状態を表示するコンポーネント
 *
 * @param {number}  totalXP   - 現在の累計 XP（今セッション分を加算済み）
 * @param {number}  gainedXP  - 今セッションで獲得した XP（進化判定・+XP表示に使用）
 * @param {"sm"|"md"|"lg"} size
 */
export default function MonsterCompanion({ totalXP = 0, gainedXP = 0, size = "md" }) {
  const current = getMonsterState(totalXP);
  const prev    = gainedXP > 0 ? getMonsterState(Math.max(0, totalXP - gainedXP)) : null;
  const evolved = prev !== null && prev.species.id !== current.species.id;

  const spriteSize = size === "sm" ? 56 : size === "lg" ? 112 : 80;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* 進化バナー */}
      {evolved && (
        <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-center text-sm font-bold text-yellow-900">
          🎉 {prev.species.name} → {current.species.name} に進化した！
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* スプライト */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{ width: spriteSize, height: spriteSize }}
        >
          <img
            src={current.species.sprite}
            alt={current.species.name}
            style={{
              imageRendering: "pixelated",
              width: spriteSize,
              height: spriteSize,
              objectFit: "contain",
            }}
          />
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          {/* 名前 + レベル */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-zinc-900">{current.species.name}</span>
            <span className="text-xs tabular-nums text-zinc-500">Lv. {current.level}</span>
          </div>

          {/* EXP バー */}
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs text-zinc-400">
              <span>EXP</span>
              <span className="tabular-nums">
                {current.currentXP.toLocaleString()} / {current.neededXP.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-700 ease-out"
                style={{ width: `${Math.min(100, current.pct * 100).toFixed(1)}%` }}
              />
            </div>
          </div>

          {/* 獲得 XP 表示 */}
          {gainedXP > 0 && (
            <p className="mt-1.5 text-xs font-semibold text-emerald-600">
              ＋{gainedXP.toLocaleString()} XP 獲得！
            </p>
          )}
        </div>
      </div>
    </div>
  );
}