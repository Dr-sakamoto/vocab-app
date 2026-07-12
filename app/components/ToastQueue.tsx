"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ActiveToast } from "@/lib/types";

const MAX_VISIBLE = 3;
// 段位置ごとの「そこに来てから消えるまで」の残り時間。奥へ押し出されるほど短くする
const DEPTH_LIFETIMES = [3000, 2000, 1000];
const DEPTH_SCALE = [1, 0.98, 0.96];
const DEPTH_OPACITY = [1, 0.82, 0.55];

interface ToastQueueProps {
  toasts: ActiveToast[];
  onDismiss: (instanceId: string) => void;
}

export default function ToastQueue({ toasts, onDismiss }: ToastQueueProps) {
  const visible = toasts.slice(0, MAX_VISIBLE);

  return (
    <div
      className="pointer-events-none fixed top-[max(1.5rem,env(safe-area-inset-top))] left-4 z-30 flex w-[min(320px,calc(100vw-2rem))] flex-col gap-2 sm:left-6"
    >
      <AnimatePresence initial={false}>
        {visible.map((toast, depth) => (
          <ToastRow key={toast.instanceId} toast={toast} depth={depth} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastRow({
  toast,
  depth,
  onDismiss,
}: {
  toast: ActiveToast;
  depth: number;
  onDismiss: (instanceId: string) => void;
}) {
  useEffect(() => {
    const lifetime =
      depth === 0
        ? toast.duration ?? DEPTH_LIFETIMES[0]
        : DEPTH_LIFETIMES[depth] ?? DEPTH_LIFETIMES[DEPTH_LIFETIMES.length - 1];
    const timer = window.setTimeout(() => onDismiss(toast.instanceId), lifetime);
    return () => window.clearTimeout(timer);
    // 段位置(depth)が変わるたび、その段に応じた残り時間で仕切り直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.instanceId, depth]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -24, scale: 0.94 }}
      animate={{ opacity: DEPTH_OPACITY[depth] ?? 0.55, x: 0, scale: DEPTH_SCALE[depth] ?? 0.96 }}
      exit={{ opacity: 0, x: -28, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="pointer-events-auto flex items-center gap-2.5 rounded-md border-2 border-[#3aa83a] bg-[#0e120b] py-1.5 pl-1.5 pr-3 font-mono shadow-[inset_0_0_0_1px_#000,0_0_10px_rgba(97,255,95,0.25)]"
    >
      <div className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-sm border border-[#3aa83a]/40 bg-black">
        {toast.image ? (
          <img
            src={toast.image}
            alt=""
            className="h-[38px] w-[38px] object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <span className="text-lg">✦</span>
        )}
      </div>
      <p className="min-w-0 flex-1 truncate text-[13px] leading-tight text-[#cfeecb]">{toast.message}</p>
      <span className="flex-none rounded-sm border border-[#ffcf4a]/60 px-2 py-0.5 text-[10px] font-bold text-[#ffcf4a]">
        {toast.title}
      </span>
    </motion.div>
  );
}
