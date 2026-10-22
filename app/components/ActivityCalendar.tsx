import { CalendarDay } from "@/lib/dailyProgress";

const WEEKDAY_LABELS = ["月", "", "水", "", "金", "", "日"];

/**
 * 伸びの量に応じたマスの濃さ（0〜1）。学習した日は伸びが0でも最低限の濃さを
 * 付けて「やった日」として見えるようにする。濃さは操作色の不透明度だけで表し、
 * 色相は増やさない。
 */
function intensity(day: CalendarDay): number {
  if (!day.played) return 0;
  if (day.gain >= 6) return 1;
  if (day.gain >= 3) return 0.75;
  if (day.gain >= 1) return 0.55;
  return 0.35;
}

/**
 * 学習カレンダー。列が週（古い週が左）、行が曜日（月〜日）。
 * セットを解き終えた日のマスが埋まる。14日の棒グラフよりも
 * 「埋まっていくマス」のほうが、空けたくない気持ちが続く。
 */
export default function ActivityCalendar({ weeks }: { weeks: CalendarDay[][] }) {
  const playedDays = weeks.flat().filter((day) => day.played).length;

  return (
    <div>
      <div className="flex gap-2">
        <div className="grid grid-rows-7 gap-1 text-[10px] leading-none text-ink-3">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="flex h-4 items-center">
              {label}
            </span>
          ))}
        </div>
        <div className="flex flex-1 justify-between gap-1">
          {weeks.map((week, w) => (
            <div key={w} className="grid flex-1 grid-rows-7 gap-1">
              {week.map((day, d) => (
                <span
                  key={d}
                  title={day.date ? `${day.date}${day.played ? `  +${Math.max(0, day.gain)}語` : ""}` : undefined}
                  className={`h-4 rounded-sm ${
                    day.date === null
                      ? ""
                      : day.played
                        ? "bg-accent"
                        : "border border-line bg-surface-2"
                  }`}
                  style={day.played ? { opacity: intensity(day) } : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-right text-[11px] tabular-nums text-ink-3">
        8週のうち {playedDays} 日学習
      </p>
    </div>
  );
}
