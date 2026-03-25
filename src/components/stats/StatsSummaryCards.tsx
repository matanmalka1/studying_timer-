import { Timer, Flame } from 'lucide-react';
import type { Session } from '../../types';
import { isSameDay, startOfDay, subDays } from 'date-fns';

interface Props {
  sessions: Session[];
}

export function StatsSummaryCards({ sessions }: Props) {
  const totalLearningSeconds = sessions
    .filter(s => s.type === 'learning')
    .reduce((acc, s) => acc + s.duration, 0);

  const streak = calculateStreak(sessions);

  return (
    <section className="grid grid-cols-2 gap-4">
      <div className="p-6 rounded-2xl bg-primary-container text-on-primary-container space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <Timer className="w-5 h-5 opacity-70" />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
            זמן למידה כולל
          </span>
        </div>
        <div className="text-2xl font-black tabular-nums">
          {Math.floor(totalLearningSeconds / 3600)}ש'{' '}
          {Math.floor((totalLearningSeconds % 3600) / 60)}ד'
        </div>
      </div>
      <div className="p-6 rounded-2xl bg-secondary-container text-on-secondary-container space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <Flame className="w-5 h-5 opacity-70" />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
            רצף למידה
          </span>
        </div>
        <div className="text-2xl font-black tabular-nums">{streak} ימים</div>
      </div>
    </section>
  );
}

function calculateStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;
  const learningDays = sessions
    .filter(s => s.type === 'learning')
    .map(s => startOfDay(new Date(s.timestamp)).getTime());
  const uniqueDays = Array.from(new Set(learningDays)).sort((a, b) => b - a);
  if (!uniqueDays.length) return 0;
  const last = new Date(uniqueDays[0] as number);
  const today = startOfDay(new Date());
  if (!isSameDay(last, today) && !isSameDay(last, subDays(today, 1))) return 0;
  let streak = 0;
  for (let i = 0; i < uniqueDays.length; i++) {
    if (isSameDay(new Date(uniqueDays[i] as number), subDays(today, streak))) {
      streak++;
    } else break;
  }
  return streak;
}
