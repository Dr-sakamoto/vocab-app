"use client";

export type StudyMode = "test" | "flash";

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
    <div className="flex shrink-0 overflow-hidden rounded-full border border-[#9a9a9a]/50 text-[10px] font-semibold">
      <button
        type="button"
        onClick={() => onChange("test")}
        aria-pressed={mode === "test"}
        className={`px-2.5 py-1 transition ${
          mode === "test" ? "bg-[#f5f5f5] text-[#0a0a0a]" : "text-[#9a9a9a] hover:bg-white/5"
        }`}
      >
        テスト
      </button>
      <button
        type="button"
        onClick={() => onChange("flash")}
        aria-pressed={mode === "flash"}
        className={`px-2.5 py-1 transition ${
          mode === "flash" ? "bg-[#f5f5f5] text-[#0a0a0a]" : "text-[#9a9a9a] hover:bg-white/5"
        }`}
      >
        フラッシュ
      </button>
    </div>
  );
}
