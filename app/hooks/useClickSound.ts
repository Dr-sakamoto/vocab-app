"use client";

import { useEffect } from "react";
import { playClickSound } from "@/lib/clickSound";

/**
 * ページ内のすべてのボタン押下に「カチャ」というクリック音を付ける。
 * documentへのpointerdownリスナー1本で済ませるので、個々のボタンに
 * ハンドラを配る必要がなく、モーダルやトースト内のボタンにも自動で効く。
 */
export function useClickSound() {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('button, [role="button"]');
      if (!button) return;
      if (button instanceof HTMLButtonElement && button.disabled) return;
      if (button.getAttribute("aria-disabled") === "true") return;
      playClickSound();
    };

    document.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
    };
  }, []);
}
