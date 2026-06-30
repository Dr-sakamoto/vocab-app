import React from "react";

function getPraiseMessage(streak: number) {
  if (streak >= 8) return { label: "MARVELOUS!!!", color: "text-red-600" };
  if (streak >= 6) return { label: "AMAZING!!", color: "text-violet-600" };
  if (streak >= 4) return { label: "EXCELLENT!", color: "text-blue-600" };
  if (streak >= 2) return { label: "GOOD", color: "text-sky-400" };
  return null;
}

interface FeedbackOverlayProps {
  checked: boolean;
  isCorrect: boolean;
  streak: number;
}

export function FeedbackOverlay({
  checked,
  isCorrect,
  streak,
}: FeedbackOverlayProps) {
  if (!checked) return null;

  const praise = isCorrect ? getPraiseMessage(streak) : null;
  const displayText = praise ? praise.label : isCorrect ? "✓ CORRECT" : "✗ INCORRECT";
  const textColorClass = praise
    ? praise.color
    : isCorrect
    ? "text-emerald-500"
    : "text-rose-500";

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-[15vh] animate-fade-in">
      <div
        className={`text-2xl sm:text-3xl font-black tracking-wider drop-shadow animate-bounce ${textColorClass} bg-white/95 px-6 py-3 rounded-2xl border border-zinc-100 shadow-xl flex flex-col items-center gap-1`}
      >
        <span>{displayText}</span>
        {isCorrect && streak > 0 && (
          <span className="text-sm sm:text-base font-bold text-zinc-500">
            {streak} Streak!
          </span>
        )}
      </div>
    </div>
  );
}

export default FeedbackOverlay;
