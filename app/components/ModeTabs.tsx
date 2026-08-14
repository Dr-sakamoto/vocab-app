"use client";

export type StudyMode = "test" | "flash" | "mistakeFlash";

interface ModeTabsProps {
  mode: StudyMode;
  onChange: (mode: StudyMode) => void;
}

/**
 * テスト／フラッシュの切り替え。
 * 問題ごとではなくセッション開始時に1回選ぶだけなので、コアループへの
 * 割り込みにはならない。
 */
export default function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <div className="flex shrink-0 gap-0.5 rounded-full border border-line bg-surface-1 p-0.5 text-xs">
      <button
        type="button"
        onClick={() => onChange("test")}
        aria-pressed={mode === "test"}
        className={`min-h-8 rounded-full px-4 py-1.5 transition ${
          mode === "test" ? "bg-line text-ink-1"
            : "text-ink-3 hover:text-ink-2"
        }`}
      >
        テスト
      </button>
      <button
        type="button"
        onClick={() => onChange("flash")}
        aria-pressed={mode === "flash"}
        className={`min-h-8 rounded-full px-4 py-1.5 transition ${
          mode === "flash" ? "bg-line text-ink-1"
            : "text-ink-3 hover:text-ink-2"
        }`}
      >
        フラッシュ
      </button>
      <button
        type="button"
        onClick={() => onChange("mistakeFlash")}
        aria-pressed={mode === "mistakeFlash"}
        className={`min-h-8 rounded-full px-4 py-1.5 transition ${
          mode === "mistakeFlash" ? "bg-line text-ink-1"
            : "text-ink-3 hover:text-ink-2"
        }`}
      >
        苦手フラッシュ
      </button>
    </div>
  );
}
