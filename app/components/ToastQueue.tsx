"use client";

import { useEffect } from "react";
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

  if (!toast) return null;

  return (
    <div className={`pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4 ${POSITION_CLASS[position] ?? POSITION_CLASS.top}`}>
      <div
        className="pointer-events-auto max-w-xl rounded-3xl border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur-sm transition duration-300 ease-out transform motion-reduce:transition-none"
        style={{ animation: "toast-slide-in 220ms ease-out" }}
      >
        <div className="flex items-start gap-3">
          {toast.image ? (
            <div className="h-14 w-14 overflow-hidden rounded-2xl bg-zinc-100 shadow-inner">
              <img
                src={toast.image}
                alt=""
                className="h-full w-full object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
              🔔
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-950">{toast.title}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-600">{toast.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
