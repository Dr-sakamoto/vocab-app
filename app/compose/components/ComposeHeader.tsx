import Link from "next/link";

interface ComposeHeaderProps {
  /** 進捗の分子・分母。セッション外（start / summary）では出さない */
  progress?: { answered: number; total: number };
  streakDays: number;
  /** 右上のリンク先。分析画面では出題画面へ戻す */
  link: { href: string; label: string };
}

/**
 * 画面上部の一行。
 *
 * 出すのは「いまどこまで進んだか」「何日続いているか」だけ。
 * 出題中に点数や正誤の気配を出さないのは、単語アプリと同じ理由
 * （書いている最中に前の問題の結果が見えると、そこで手が止まる）。
 */
export default function ComposeHeader({ progress, streakDays, link }: ComposeHeaderProps) {
  const percent = progress && progress.total > 0
    ? Math.round((progress.answered / progress.total) * 100)
    : 0;

  return (
    <header className="shrink-0">
      <div className="flex items-center justify-between gap-3 text-xs text-ink-3">
        <div className="flex items-center gap-3">
          <span className="text-ink-2">瞬間英作文</span>
          {progress && (
            <span className="tabular-nums">
              <span className="text-ink-1">{progress.answered}</span>
              {" / "}
              {progress.total} 問
            </span>
          )}
          {streakDays > 0 && <span className="tabular-nums">連続 {streakDays} 日</span>}
        </div>
        <Link
          href={link.href}
          className="rounded-md px-2 py-1 text-ink-3 transition hover:bg-surface-1 hover:text-ink-2"
        >
          {link.label}
        </Link>
      </div>

      {progress && (
        <div
          className="gauge-track mt-2 h-1 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={progress.answered}
          aria-valuemin={0}
          aria-valuemax={progress.total}
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </header>
  );
}
