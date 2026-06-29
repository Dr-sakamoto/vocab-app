"use client";

import { useEffect } from "react";
import { TrainerChallenge } from "@/lib/types";

interface TrainerChallengeAlertProps {
  alert: TrainerChallenge | null;
  onDismiss: () => void;
}

export default function TrainerChallengeAlert({ alert, onDismiss }: TrainerChallengeAlertProps) {
  useEffect(() => {
    if (!alert) return undefined;
    const timer = window.setTimeout(() => onDismiss?.(), alert.duration ?? 5200);
    return () => window.clearTimeout(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-40 flex justify-center px-4">
      <div
        className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-3xl border-2 border-rose-600 bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-2xl"
        style={{ animation: "toast-slide-in 220ms ease-out" }}
      >
        <div className="flex items-stretch gap-0">
          {alert.trainerSprite ? (
            <div className="flex w-28 shrink-0 items-end justify-center bg-black/15 px-2 pb-2 pt-4">
              <img
                src={alert.trainerSprite}
                alt=""
                className="max-h-28 w-full object-contain object-bottom"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          ) : null}

          <div className="min-w-0 flex-1 p-4">
            <div className="flex items-start gap-3">
              {alert.image ? (
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white/15 shadow-inner">
                  <img
                    src={alert.image}
                    alt=""
                    className="h-full w-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                  ⚔️
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-100">バトル発生</p>
                <p className="mt-1 text-base font-bold">{alert.title}</p>
                {alert.message ? (
                  <p className="mt-1 text-sm leading-6 text-rose-50">{alert.message}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
