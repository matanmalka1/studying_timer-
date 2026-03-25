import { Flame } from 'lucide-react';
import { format, startOfWeek, subDays, isSameDay, isAfter } from 'date-fns';
import { he } from 'date-fns/locale';
import type { Session } from '../../types';

interface Props {
  sessions: Session[];
}

export function YearlyHeatmap({ sessions }: Props) {
  const getDayStats = (date: Date) => {
    const daySessions = sessions.filter(
      s => isSameDay(new Date(s.timestamp), date) && s.type === 'learning'
    );
    const totalSeconds = daySessions.reduce((acc, s) => acc + s.duration, 0);
    return { hours: totalSeconds / 3600 };
  };

  const yearlyData = Array.from({ length: 52 }, (_, weekIndex) => {
    const weekStart = startOfWeek(subDays(new Date(), (51 - weekIndex) * 7));
    return Array.from({ length: 7 }, (_, dayIndex) => {
      const date = subDays(weekStart, -dayIndex);
      return { date, stats: getDayStats(date) };
    });
  });

  return (
    <section className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-6 overflow-hidden">
      <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
        <Flame className="w-5 h-5 text-secondary" />
        פעילות שנתית
      </h3>
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2" dir="ltr">
        {yearlyData.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1 shrink-0">
            {week.map((day, dIdx) => {
              const intensity = Math.min(day.stats.hours / 4, 1);
              const isFuture = isAfter(day.date, new Date());
              return (
                <div
                  key={dIdx}
                  className="w-3 h-3 rounded-[2px] group relative"
                  style={{
                    backgroundColor: isFuture
                      ? 'transparent'
                      : day.stats.hours > 0
                      ? `rgba(var(--color-primary-rgb), ${0.1 + intensity * 0.9})`
                      : 'var(--color-surface-container-high)',
                  }}
                >
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 bg-surface-container-highest text-on-surface text-[10px] p-2 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                    {format(day.date, 'dd/MM/yyyy', { locale: he })}
                    <br />
                    {day.stats.hours.toFixed(1)} שעות
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
