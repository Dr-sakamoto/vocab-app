"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ToastItem } from "@/lib/types";

type Position = "top" | "mobile-bottom";

const POSITION_CLASS: Record<Position, string> = {
  top: "top-6",
  "mobile-bottom": "bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:bottom-auto sm:top-6",
};

interface ToastQueueProps {
  toast: ToastItem | null;
  onDismiss: () => void;
  position?: Position;
}

export default function ToastQueue({ toast, onDismiss, position = "top" }: ToastQueueProps) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => onDismiss?.(), toast.duration ?? 4800);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className={`pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4 ${POSITION_CLASS[position] ?? POSITION_CLASS.top}`}>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="pointer-events-auto max-w-xl rounded-3xl border border-indigo-100 bg-white/90 p-4 shadow-2xl shadow-indigo-100/50 backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              {toast.image ? (
                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-indigo-50 shadow-inner">
                  <img
                    src={toast.image}
                    alt=""
                    className="h-full w-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  🔔
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-950">{toast.title}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{toast.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
