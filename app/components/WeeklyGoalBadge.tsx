import { WeeklyGoalStatus } from "@/lib/weeklyGoal";

/**
 * ヘッダーに出す週次目標。「今週 3/5 日」と、達成が続いている週数。
 *
 * 毎日ストリークと違い、週のうち目標日数を満たせば残りの日は休んでも
 * 途切れない（lib/weeklyGoal.ts）。0 日でも出すのは、今週あと何日で
 * 達成かを見えるようにするため。
 */
export default function WeeklyGoalBadge({ status }: { status: WeeklyGoalStatus }) {
  const { daysThisWeek, goal, achievedThisWeek, weekStreak } = status;
  return (
    <span className="tabular-nums" aria-label={`今週${daysThisWeek}日／目標${goal}日`}>
      今週{" "}
      <span className={achievedThisWeek ? "text-positive" : "text-ink-1"}>
        {Math.min(daysThisWeek, 7)}
      </span>
      {" / "}
      {goal} 日
      {weekStreak > 0 && <span className="ml-2">{weekStreak} 週連続</span>}
    </span>
  );
}
