"use client";

/**
 * 背景の装飾用グラデーションブロブ。操作には一切関与しない見た目だけの要素。
 */
export default function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="aurora-blob h-72 w-72 bg-indigo-400/50 sm:h-96 sm:w-96"
        style={{ top: "-10%", left: "-10%" }}
      />
      <div
        className="aurora-blob h-72 w-72 bg-violet-400/40 sm:h-96 sm:w-96"
        style={{ bottom: "-15%", right: "-10%", animationDelay: "3s" }}
      />
      <div
        className="aurora-blob h-56 w-56 bg-sky-300/30"
        style={{ top: "35%", right: "15%", animationDelay: "6s" }}
      />
    </div>
  );
}
