"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { MonsterCollection } from "@/lib/types";
import EtymonDock from "./EtymonDock";
import PokemonBox, { PokemonBoxProps } from "./PokemonBox";

type BoxHandlerProps = Pick<
  PokemonBoxProps,
  | "limit"
  | "forceManage"
  | "onSwap"
  | "onRemove"
  | "onSendToProfessor"
  | "onSortBox"
  | "onOpenSync"
  | "onSetActive"
>;

interface EtymonPartySheetProps extends BoxHandlerProps {
  collection: MonsterCollection;
  onSelect: (monsterId: string) => void;
  /** 開いているか（page 側の状態。上限超過などで外部から開かれることもある） */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SPRING = { type: "spring", stiffness: 320, damping: 34, mass: 0.9 } as const;

/**
 * スマホ版の「地続きボトムシート」。
 *
 * 手持ち欄（のぞき見 = peek）のつまみを上へ引くと、そのドラッグ量に
 * 直結して控えボックス面が画面下から連続的にせり上がる（＝下から生えて
 * 指についてくる）。指を離した位置・速度で開ききる／戻るをスナップする。
 * しきい値超えで別モーダルが瞬間表示される従来方式の「遷移感」を排除する。
 */
export default function EtymonPartySheet({
  collection,
  onSelect,
  open,
  onOpenChange,
  limit,
  forceManage = false,
  onSwap,
  onRemove,
  onSendToProfessor,
  onSortBox,
  onOpenSync,
  onSetActive,
}: EtymonPartySheetProps) {
  // 0 = 閉（控えボックスは画面下に隠れる）, 1 = 開（画面を覆う）
  const progress = useMotionValue(open ? 1 : 0);
  const boxY = useTransform(progress, [0, 1], ["100%", "0%"]);
  const dim = useTransform(progress, [0, 1], [0, 0.72]);

  // 引き切るのに必要なドラッグ量（画面高の約55%）。指追従の感度基準。
  const dragDist = useRef(360);
  const panStart = useRef(0);
  const didPan = useRef(false);

  useEffect(() => {
    const update = () => {
      dragDist.current = Math.max(240, Math.round(window.innerHeight * 0.55));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 外部から open が変わったら（上限超過での強制表示・×閉じ 等）追従アニメ
  useEffect(() => {
    const controls = animate(progress, open ? 1 : 0, SPRING);
    return () => controls.stop();
  }, [open, progress]);

  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

  const handlePanStart = () => {
    panStart.current = progress.get();
    didPan.current = false;
  };
  const handlePan = (_: PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 6) didPan.current = true;
    // 上方向ドラッグ（offset.y 負）で開く方向へ進む
    progress.set(clamp01(panStart.current - info.offset.y / dragDist.current));
  };
  const settle = (info: PanInfo) => {
    const p = progress.get();
    let target = p > 0.5 ? 1 : 0;
    if (info.velocity.y < -420) target = 1;
    if (info.velocity.y > 420) target = 0;
    if (forceManage) target = 1; // 上限超過中は閉じさせない
    animate(progress, target, SPRING);
    const nextOpen = target === 1;
    if (nextOpen !== open) onOpenChange(nextOpen);
  };

  const openSheet = () => {
    if (didPan.current) return; // ドラッグ直後のタップ誤発火を防ぐ
    if (!open) onOpenChange(true);
  };
  const closeSheet = () => {
    if (forceManage) return;
    if (open) onOpenChange(false);
    else animate(progress, 0, SPRING);
  };

  return (
    <div className="relative h-full">
      {/* ── のぞき見（peek）: 通常時に見える手持ち欄。上辺のつまみを
             上へ引くと控えボックスが下から連続的にせり上がる ── */}
      <motion.div
        role="button"
        tabIndex={0}
        aria-label="手持ち編成を開く"
        className="absolute inset-x-0 top-0 z-20 flex touch-none cursor-grab select-none justify-center active:cursor-grabbing"
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={(_, info) => settle(info)}
        onTap={openSheet}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) onOpenChange(true);
          }
        }}
      >
        <span
          aria-hidden
          className="block h-3.5 w-14 rounded-b-full bg-black/50 shadow-[inset_0_2px_5px_rgba(0,0,0,0.7),inset_0_-1px_1px_rgba(255,255,255,0.3)]"
        >
          <span className="mx-auto mt-1 block h-1 w-6 rounded-full bg-[#f5f5f5]/70" />
        </span>
      </motion.div>
      <EtymonDock collection={collection} onSelect={onSelect} asPeek />

      {/* ── 背景の減光（せり上がりに連動。操作は下の手持ち／ボックスに委ねる） ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 bg-black"
        style={{ opacity: dim }}
      />

      {/* ── 控えボックス面: 引き上げに連れて下から生えてくる本体 ── */}
      <motion.div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ y: boxY }}
      >
        {/* 掴んで下へ引くと閉じるハンドルバー */}
        <motion.div
          role="button"
          tabIndex={forceManage ? -1 : 0}
          aria-label="手持ち編成を閉じる"
          className="flex shrink-0 touch-none cursor-grab select-none justify-center bg-[#1a1206] py-2 active:cursor-grabbing"
          onPanStart={handlePanStart}
          onPan={handlePan}
          onPanEnd={(_, info) => settle(info)}
          onTap={() => {
            if (!didPan.current) closeSheet();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              closeSheet();
            }
          }}
        >
          <span aria-hidden className="block h-1.5 w-12 rounded-full bg-[#f5f5f5]/60" />
        </motion.div>
        <div className="min-h-0 flex-1">
          <PokemonBox
            embedded
            collection={collection}
            limit={limit}
            forceManage={forceManage}
            onClose={closeSheet}
            onSwap={onSwap}
            onRemove={onRemove}
            onSendToProfessor={onSendToProfessor}
            onSortBox={onSortBox}
            onOpenSync={onOpenSync}
            onSetActive={onSetActive}
          />
        </div>
      </motion.div>
    </div>
  );
}
