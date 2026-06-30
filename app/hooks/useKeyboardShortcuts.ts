import { useEffect, useRef } from "react";
import { GameView } from "@/lib/types";

interface UseKeyboardShortcutsProps {
  activeView: GameView;
  startGame: () => void;
  restart: () => void;
}

export function useKeyboardShortcuts({
  activeView,
  startGame,
  restart,
}: UseKeyboardShortcutsProps) {
  const resultReadyRef = useRef<boolean>(false);

  useEffect(() => {
    if (activeView !== "start") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to start the game, unless focused on a button
      if (e.key !== "Enter" || (e.target as HTMLElement)?.closest?.("button")) {
        return;
      }
      startGame();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeView, startGame]);

  useEffect(() => {
    if (activeView !== "result") {
      resultReadyRef.current = false;
      return;
    }

    resultReadyRef.current = false;
    const timer = window.setTimeout(() => {
      resultReadyRef.current = true;
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && resultReadyRef.current) {
        restart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeView, restart]);
}
