import { getTagLabel } from "@/lib/compose/grammarTags";
import type { TagVerdict } from "@/lib/compose/types";

const VERDICT_STYLE: Record<TagVerdict, { symbol: string; className: string }> = {
  // 記号と色の両方で区別する。色だけに頼ると、色覚特性や
  // モノクロ表示で ok と missed が同じ見た目になる（SC 1.4.1）。
  ok: { symbol: "○", className: "text-positive" },
  shaky: { symbol: "△", className: "text-warning" },
  missed: { symbol: "×", className: "text-negative" },
};

interface TagChipProps {
  tagId: string;
  /** AI採点の判定。無いときはタグ名だけの静かなチップ */
  verdict?: TagVerdict;
}

/** 文法タグの表示単位。出題・講評・分析のどこでも同じ見た目にする */
export default function TagChip({ tagId, verdict }: TagChipProps) {
  const style = verdict ? VERDICT_STYLE[verdict] : null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[11px] ${
        style ? style.className : "text-ink-3"
      }`}
    >
      {style && <span aria-hidden>{style.symbol}</span>}
      {getTagLabel(tagId)}
    </span>
  );
}
