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
  /** 開いているか（page 側の状態。上限超過などで外部から開かれることもある） */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SPRING = { type: "spring", stiffness: 320, damping: 34, mass: 0.9 } as const;

// 閉じたときに最下段へ残す盤面上部（つまみ＋ヘッダ）の高さ。
// MobileGameScreen の footer 高さ（h-32 = 128px）と一致させる。
const PEEK_PX = 128;

/**
 * スマホ版の「地続きボトムシート」。
 *
 * 従来は手持ち欄（のぞき見ドック）をつまみにしていたが、手持ち欄を一旦
 * 廃し、ボックス管理画面（PokemonBox）の**上部ヘッダ**そのものを最下段に
 * のぞかせる方式へ変更した。つまみ（ヘッダ）を上へ引くと、ドラッグ量に
 * 直結して同じ盤面が画面下から連続的にせり上がり、そのまま地続きに
 * ボックス管理画面へ広がる。しきい値超えで別モーダルが瞬間表示される
 * 「遷移感」を排除し、のぞき見と全画面が同一の盤面（＝一枚もの）になる。
 *
 * ※手持ち欄の UI 仕様は docs/PARTY_DOCK_PEEK_UI.md に記録。
 */
export default function EtymonPartySheet({
  collection,
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
  // 0 = 閉（ヘッダだけが最下段からのぞく）, 1 = 開（画面を覆う）
  const progress = useMotionValue(open ? 1 : 0);
  // 閉じても最下段に PEEK_PX 分（＝footer の高さ）だけ盤面上部を残す。
  // これにより「ボックス管理画面の上部がそのまま下部にくる」状態になる。
  const boxY = useTransform(progress, [0, 1], [`calc(100% - ${PEEK_PX}px)`, "0%"]);
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
      {/* ── 背景の減光（せり上がりに連動。操作は下の盤面に委ねる） ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 bg-black"
        style={{ opacity: dim }}
      />

      {/* ── ボックス管理盤面: 閉じても上部ヘッダだけが最下段にのぞき、
             引き上げに連れて同じ盤面が下から地続きにせり上がる本体 ── */}
      <motion.div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ y: boxY }}
      >
        {/* 掴んで上へ引くと開き／下へ引くと閉じるハンドルバー（つまみ） */}
        <motion.div
          role="button"
          tabIndex={forceManage ? -1 : 0}
          aria-label={open ? "エティモン管理を閉じる" : "エティモン管理を開く"}
          className="flex shrink-0 touch-none cursor-grab select-none justify-center py-2 active:cursor-grabbing"
          onPanStart={handlePanStart}
          onPan={handlePan}
          onPanEnd={(_, info) => settle(info)}
          onTap={() => {
            if (didPan.current) return;
            if (open) closeSheet();
            else onOpenChange(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (open) closeSheet();
              else onOpenChange(true);
            }
          }}
        >
          <span aria-hidden className="block h-1.5 w-12 rounded-full bg-[#f5f5f5]/60" />
        </motion.div>

        <div className="relative min-h-0 flex-1">
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

          {/* 閉じている間だけ、のぞいているヘッダ帯全体をタップ／上ドラッグの
              つまみにする透過ヒット面。開いたら無効化してヘッダ操作を通す。
              pointer-events は open（ジェスチャ確定時のみ変化）で切り替え、
              引き上げドラッグの途中で無効化されないようにする。 */}
          <motion.div
            aria-hidden
            className="absolute inset-0 touch-none"
            style={{ pointerEvents: open ? "none" : "auto" }}
            onPanStart={handlePanStart}
            onPan={handlePan}
            onPanEnd={(_, info) => settle(info)}
            onTap={openSheet}
          />
        </div>
      </motion.div>
    </div>
  );
}
