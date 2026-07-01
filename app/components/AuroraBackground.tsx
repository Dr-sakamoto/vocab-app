"use client";

interface AuroraBackgroundProps {
  /** trueで彩度・スケールを上げた強めの演出にする（スタート/クイズ画面向け） */
  vivid?: boolean;
  /** 指定するとTailwindの固定色ではなく、この3色（例: ティアテーマ）を使う */
  colors?: [string, string, string];
}

/**
 * 背景の装飾用グラデーションブロブ。操作には一切関与しない見た目だけの要素。
 */
export default function AuroraBackground({ vivid = false, colors }: AuroraBackgroundProps) {
  const scale = vivid ? "h-80 w-80 sm:h-[28rem] sm:w-[28rem]" : "h-72 w-72 sm:h-96 sm:w-96";
  const smallScale = vivid ? "h-64 w-64" : "h-56 w-56";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className={colors ? `aurora-blob ${scale}` : `aurora-blob ${scale} ${vivid ? "bg-indigo-400/60" : "bg-indigo-400/50"}`}
        style={{
          top: "-10%",
          left: "-10%",
          ...(colors ? { backgroundColor: colors[0], opacity: vivid ? 0.6 : 0.5 } : {}),
        }}
      />
      <div
        className={colors ? `aurora-blob ${scale}` : `aurora-blob ${scale} ${vivid ? "bg-violet-400/55" : "bg-violet-400/40"}`}
        style={{
          bottom: "-15%",
          right: "-10%",
          animationDelay: "3s",
          ...(colors ? { backgroundColor: colors[1], opacity: vivid ? 0.55 : 0.4 } : {}),
        }}
      />
      <div
        className={colors ? `aurora-blob ${smallScale}` : `aurora-blob ${smallScale} bg-sky-300/30`}
        style={{
          top: "35%",
          right: "15%",
          animationDelay: "6s",
          ...(colors ? { backgroundColor: colors[2], opacity: 0.3 } : {}),
        }}
      />
      {vivid && !colors && (
        <div
          className="aurora-blob h-60 w-60 bg-rose-300/25"
          style={{ bottom: "10%", left: "20%", animationDelay: "9s" }}
        />
      )}
    </div>
  );
}
