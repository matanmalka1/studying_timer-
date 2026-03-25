import { useState } from 'react';
import { BarChart2, Undo2, Redo2 } from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { he } from 'date-fns/locale';
import type { Session } from '../../types';

interface Props {
  sessions: Session[];
}

export function CalendarView({ sessions }: Props) {
  const [calendarDate, setCalendarDate] = useState(new Date());

  const getDayStats = (date: Date) => {
    const daySessions = sessions.filter(
      s => isSameDay(new Date(s.timestamp), date) && s.type === 'learning'
    );
    const totalSeconds = daySessions.reduce((acc, s) => acc + s.duration, 0);
    return { hours: totalSeconds / 3600 };
  };

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarDate)),
    end: endOfWeek(endOfMonth(calendarDate)),
  });

  const weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  return (
    <section className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          לוח שנה למידה
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalendarDate(prev => subMonths(prev, 1))}
            className="p-1 hover:bg-surface-container-high rounded-lg transition-colors"
          >
            <Undo2 className="w-4 h-4 rotate-180" />
          </button>
          <span className="text-sm font-bold min-w-[100px] text-center">
            {format(calendarDate, 'MMMM yyyy', { locale: he })}
          </span>
          <button
            onClick={() => setCalendarDate(prev => addMonths(prev, 1))}
            className="p-1 hover:bg-surface-container-high rounded-lg transition-colors"
          >
            <Redo2 className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-on-surface-variant py-2">
            {day}
          </div>
        ))}
        {calendarDays.map((date, i) => {
          const stats = getDayStats(date);
          const isCurrentMonth = date.getMonth() === calendarDate.getMonth();
          const intensity = Math.min(stats.hours / 4, 1);
          return (
            <div
              key={i}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center relative group transition-all ${!isCurrentMonth ? 'opacity-20' : ''}`}
              style={{
                backgroundColor:
                  stats.hours > 0
                    ? `rgba(var(--color-primary-rgb), ${0.1 + intensity * 0.9})`
                    : 'var(--color-surface-container-high)',
              }}
            >
              <span className={`text-[10px] font-bold ${stats.hours > 0.5 ? 'text-on-primary' : 'text-on-surface'}`}>
                {format(date, 'd')}
              </span>
              {isToday(date) && (
                <div className="absolute bottom-1 w-1 h-1 bg-secondary rounded-full" />
              )}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 bg-surface-container-highest text-on-surface text-[10px] p-2 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                {format(date, 'dd/MM/yyyy', { locale: he })}
                <br />
                {stats.hours.toFixed(1)} שעות למידה
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
