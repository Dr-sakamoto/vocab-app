"use client";

import { motion } from "framer-motion";
import { MonsterCollection } from "@/lib/types";
import {
  getMonsterDisplayState,
  getPartySlots,
  normalizeMonsterCollection,
} from "@/lib/monster";
import {
  BATTLE_PARTY_SIZE,
  getPartyAttackPower,
} from "@/lib/wildEncounter";

interface EtymonDockProps {
  collection: MonsterCollection;
  onSelect?: (monsterId: string) => void;
  /** 取っ手のタップ / 上方向ドラッグで手持ち編成ドロワーを開く */
  onOpenDrawer: () => void;
}

/**
 * ブロック3: エティモンウィンドウ。
 * バトル参加の手持ち4体と、上へ引き出す丸い取っ手。
 * 取っ手をタップするか上へドラッグすると編成ドロワーがにょきっと出てくる。
 */
export default function EtymonDock({
  collection,
  onSelect,
  onOpenDrawer,
}: EtymonDockProps) {
  const normalized = normalizeMonsterCollection(collection);
  const slots = getPartySlots(normalized).slice(0, BATTLE_PARTY_SIZE);
  const attackPower = getPartyAttackPower(normalized);

  return (
    <div className="relative h-full">
      {/* 凹の持ち手（パネル上辺の中央に彫り込まれたくぼみ。目立たせない） */}
      <div className="absolute inset-x-0 top-0 z-20 flex justify-center">
        <motion.button
          type="button"
          onClick={onOpenDrawer}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.6, bottom: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.y < -18 || info.velocity.y < -300) onOpenDrawer();
          }}
          aria-label="手持ち編成を開く"
          className="cursor-grab touch-none px-5 pb-2 active:cursor-grabbing"
        >
          <span
            aria-hidden
            className="block h-3.5 w-14 rounded-b-full bg-indigo-950/10 shadow-[inset_0_2px_5px_rgba(49,46,129,0.28),inset_0_-1px_1px_rgba(255,255,255,0.8)]"
          >
            <span className="mx-auto mt-1 block h-1 w-6 rounded-full bg-indigo-300/60" />
          </span>
        </motion.button>
      </div>

      <div className="glass-panel mx-1.5 mb-1.5 flex h-[calc(100%-0.375rem)] min-h-0 items-stretch gap-1.5 rounded-2xl px-2 pb-1.5 pt-3 sm:mx-2 sm:mb-2 sm:gap-2 sm:px-3">
        {slots.map((monster, index) => {
          if (!monster) {
            return (
              <div
                key={`empty-${index}`}
                className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200/80 bg-white/40 text-zinc-300"
                aria-label={`手持ちスロット${index + 1}（空き）`}
              >
                <span className="text-lg leading-none">+</span>
              </div>
            );
          }

          const state = getMonsterDisplayState(monster);
          const isActive = monster.id === normalized.activeId;
          return (
            <motion.button
              key={monster.id}
              type="button"
              onClick={() => onSelect?.(monster.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border px-1 py-0.5 transition-colors ${
                isActive
                  ? "border-indigo-400 bg-indigo-50/90 shadow-md shadow-indigo-200/60"
                  : "border-transparent bg-white/50 hover:border-indigo-200"
              }`}
              aria-label={`${state.species.name} Lv.${state.level}${isActive ? "（せんとう）" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.species.sprite}
                alt=""
                aria-hidden
                onError={(e) => {
                  if (e.currentTarget.src !== state.species.fallbackSprite) {
                    e.currentTarget.src = state.species.fallbackSprite;
                  }
                }}
                className="min-h-0 w-auto flex-1 object-contain"
                style={{ imageRendering: "pixelated", maxHeight: "62%" }}
              />
              <span className="max-w-full truncate text-[10px] font-medium text-zinc-700 sm:text-xs">
                {state.species.name}
              </span>
              <span className="text-[9px] tabular-nums text-zinc-400 sm:text-[11px]">
                Lv.{state.level}
              </span>
            </motion.button>
          );
        })}

        {/* 攻撃力（1正解あたりのダメージ）表示 */}
        <div
          className="flex w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-white/50 text-center sm:w-14"
          title="1正解ごとに出現エティモンへ与えるダメージ"
        >
          <span className="text-[9px] font-bold uppercase tracking-wide text-indigo-400 sm:text-[10px]">
            ATK
          </span>
          <span className="text-base font-bold tabular-nums text-indigo-950 sm:text-lg">
            {attackPower}
          </span>
        </div>
      </div>
    </div>
  );
}
