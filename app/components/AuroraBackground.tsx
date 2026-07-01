"use client";

interface AuroraBackgroundProps {
  /** trueで彩度・スケールを上げた強めの演出にする（スタート/クイズ画面向け） */
  vivid?: boolean;
}

/**
 * 背景の装飾用グラデーションブロブ。操作には一切関与しない見た目だけの要素。
 */
export default function AuroraBackground({ vivid = false }: AuroraBackgroundProps) {
  const scale = vivid ? "h-80 w-80 sm:h-[28rem] sm:w-[28rem]" : "h-72 w-72 sm:h-96 sm:w-96";
  const opacityIndigo = vivid ? "bg-indigo-400/60" : "bg-indigo-400/50";
  const opacityViolet = vivid ? "bg-violet-400/55" : "bg-violet-400/40";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className={`aurora-blob ${scale} ${opacityIndigo}`}
        style={{ top: "-10%", left: "-10%" }}
      />
      <div
        className={`aurora-blob ${scale} ${opacityViolet}`}
        style={{ bottom: "-15%", right: "-10%", animationDelay: "3s" }}
      />
      <div
        className={`aurora-blob ${vivid ? "h-64 w-64" : "h-56 w-56"} bg-sky-300/30`}
        style={{ top: "35%", right: "15%", animationDelay: "6s" }}
      />
      {vivid && (
        <div
          className="aurora-blob h-60 w-60 bg-rose-300/25"
          style={{ bottom: "10%", left: "20%", animationDelay: "9s" }}
        />
      )}
    </div>
  );
}
