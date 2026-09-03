/**
 * 待ち時間の表示。単語アプリの「採点中…」と同じ12枚羽根のスピナー
 * （スタイルは app/globals.css の .ios-spinner）。
 *
 * 出すのは「押すものが無い待ち」のときだけ。操作できるものの隣に
 * 置くと、待ちなのか操作できるのか分からなくなる。
 */
export default function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-ink-3">
      <span className="ios-spinner" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="ios-spinner-bar"
            style={{
              transform: `rotate(${i * 30}deg)`,
              animationDelay: `${-((12 - i) % 12) / 12}s`,
            }}
          />
        ))}
      </span>
      {label}
    </span>
  );
}
