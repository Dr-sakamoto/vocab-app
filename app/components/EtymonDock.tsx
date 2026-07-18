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
 * ブロック3: エティモンウィンドウ（ハイファンタジースキン）。
 * 木の台座にバトル参加の手持ち4体の札を並べる。上辺中央の
 * 凹の持ち手をタップ or 上へドラッグすると編成が開く。
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
      {/* 凹の持ち手（台座上辺の中央に彫り込まれたくぼみ。目立たせない） */}
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
            className="block h-3.5 w-14 rounded-b-full bg-black/50 shadow-[inset_0_2px_5px_rgba(0,0,0,0.7),inset_0_-1px_1px_rgba(255,255,255,0.3)]"
          >
            <span className="mx-auto mt-1 block h-1 w-6 rounded-full bg-[#f5f5f5]/70" />
          </span>
        </motion.button>
      </div>

      <div className="wood-panel flex h-full min-h-0 items-stretch gap-1.5 rounded-lg px-2 pb-1.5 pt-3 sm:gap-2 sm:px-3">
        {slots.map((monster, index) => {
          if (!monster) {
            return (
              <div
                key={`empty-${index}`}
                className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-md border border-dashed border-[#9a9a9a]/40 bg-black/30 text-[#9a9a9a]/50"
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
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-md px-1 py-0.5 transition-all ${
                isActive
                  ? "parchment shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  : "border border-[#9a9a9a]/25 bg-black/30 hover:border-[#f5f5f5]/60"
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
                style={{ imageRendering: "pixelated", maxHeight: "70%" }}
              />
              <span
                className={`max-w-full truncate text-[10px] font-medium leading-tight sm:text-xs ${
                  isActive ? "text-[#f5f5f5]" : "text-[#e6e6e6]"
                }`}
              >
                {state.species.name}
              </span>
              <span className="font-fantasy text-[8px] leading-tight tabular-nums text-[#7d7d7d] sm:text-[9px]">
                Lv.{state.level}
              </span>
            </motion.button>
          );
        })}

        {/* 攻撃力（1正解あたりのダメージ）: 真鍮のプレート */}
        <div
          className="brass-btn flex w-12 shrink-0 flex-col items-center justify-center rounded-md text-center sm:w-16"
          title="1正解ごとに出現エティモンへ与えるダメージ"
        >
          <span className="font-fantasy text-[9px] font-bold text-[#ffcf4a] sm:text-[10px]">
            ATK
          </span>
          <span className="font-fantasy text-base font-bold tabular-nums sm:text-lg">
            {attackPower}
          </span>
        </div>
      </div>
    </div>
  );
}
