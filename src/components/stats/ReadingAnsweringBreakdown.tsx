import { BookMarked } from 'lucide-react';
import { format } from 'date-fns';
import type { Session } from '../../types';
import { formatTimeShort } from '../../utils';

interface Props {
  sessions: Session[];
}

export function ReadingAnsweringBreakdown({ sessions }: Props) {
  const subPhaseSessions = sessions
    .filter(s => s.type === 'learning' && s.readingDuration !== undefined)
    .slice(0, 10);

  if (!subPhaseSessions.length) return null;

  return (
    <section className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-4">
      <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
        <BookMarked className="w-5 h-5 text-primary" />
        קריאה מול תשובה
      </h3>
      <div className="space-y-3">
        {subPhaseSessions.map(s => {
          const r = s.readingDuration ?? 0;
          const a = s.answeringDuration ?? 0;
          const total = r + a || 1;
          return (
            <div key={s.id} className="space-y-1">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>{s.subject}</span>
                <span className="tabular-nums">{format(new Date(s.timestamp), 'dd/MM HH:mm')}</span>
              </div>
              <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
                <div
                  className="bg-primary flex items-center justify-center text-[9px] font-bold text-on-primary transition-all"
                  style={{ width: `${(r / total) * 100}%` }}
                >
                  {r > 30 && formatTimeShort(r)}
                </div>
                <div
                  className="bg-secondary flex items-center justify-center text-[9px] font-bold text-on-secondary transition-all"
                  style={{ width: `${(a / total) * 100}%` }}
                >
                  {a > 30 && formatTimeShort(a)}
                </div>
              </div>
              <div className="flex gap-3 text-[10px] text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  קריאה {formatTimeShort(r)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
                  תשובה {formatTimeShort(a)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
