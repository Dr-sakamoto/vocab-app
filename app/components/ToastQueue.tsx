"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ActiveToast } from "@/lib/types";

type Position = "top" | "mobile-bottom";

const POSITION_CLASS: Record<Position, string> = {
  top: "top-6 left-4 sm:left-6",
  "mobile-bottom":
    "bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-4 right-4 sm:bottom-auto sm:right-auto sm:top-6 sm:left-6",
};

const MAX_VISIBLE = 3;
const DEFAULT_LIFETIME = 4200;
const DEPTH_SCALE = [1, 0.98, 0.96];
const DEPTH_OPACITY = [1, 0.82, 0.55];

interface ToastQueueProps {
  toasts: ActiveToast[];
  onDismiss: (instanceId: string) => void;
  position?: Position;
}

export default function ToastQueue({ toasts, onDismiss, position = "top" }: ToastQueueProps) {
  const visible = toasts.slice(0, MAX_VISIBLE);

  return (
    <div
      className={`pointer-events-none fixed z-30 flex w-[min(320px,calc(100vw-2rem))] flex-col gap-2 ${POSITION_CLASS[position] ?? POSITION_CLASS.top}`}
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
    const timer = window.setTimeout(
      () => onDismiss(toast.instanceId),
      toast.duration ?? DEFAULT_LIFETIME,
    );
    return () => window.clearTimeout(timer);
    // 個体の表示時間は初回マウント時のdurationのみで決める（依存にtoast/onDismissを含めない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.instanceId]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -24, scale: 0.94 }}
      animate={{ opacity: DEPTH_OPACITY[depth] ?? 0.55, x: 0, scale: DEPTH_SCALE[depth] ?? 0.96 }}
      exit={{ opacity: 0, x: -28, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="pointer-events-auto flex items-center gap-2.5 rounded-[20px] border border-white/60 bg-white/88 py-1.5 pl-1.5 pr-3.5 shadow-[0_4px_16px_rgba(24,24,27,0.10),0_1px_3px_rgba(24,24,27,0.06)] backdrop-blur-md"
    >
      <div className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl bg-indigo-50">
        {toast.image ? (
          <img
            src={toast.image}
            alt=""
            className="h-[38px] w-[38px] object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <span className="text-lg">🔔</span>
        )}
      </div>
      <p className="min-w-0 flex-1 truncate text-[13px] leading-tight text-zinc-800">{toast.message}</p>
      <span className="flex-none rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
        {toast.title}
      </span>
    </motion.div>
  );
}
