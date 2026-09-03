import { diffWords } from "@/lib/compose/diff";

/**
 * 自分の答案と添削文の差分。
 *
 * 添削文だけを見せると「どこが直されたのか」を目で探すところから
 * 始まる。消された語（打ち消し線）と足された語（下線）をその場に
 * 並べて、書いた本人にしか分からない差を機械の側で示す。
 */
export default function DiffText({ before, after }: { before: string; after: string }) {
  const segments = diffWords(before, after);

  return (
    <p className="text-sm leading-relaxed text-ink-2">
      {segments.map((segment, i) => (
        <span
          key={i}
          className={
            segment.type === "added"
              ? "diff-added"
              : segment.type === "removed"
                ? "diff-removed"
                : ""
          }
        >
          {segment.text}
          {i < segments.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
