import type { Session } from '../../types';
import { CalendarView } from './CalendarView';
import { StatsSummaryCards } from './StatsSummaryCards';
import { ReadingAnsweringBreakdown } from './ReadingAnsweringBreakdown';
import { YearlyHeatmap } from './YearlyHeatmap';

interface StatsViewProps {
  sessions: Session[];
}

export function StatsView({ sessions }: StatsViewProps) {
  return (
    <div className="space-y-8 pb-20">
      <StatsSummaryCards sessions={sessions} />
      <YearlyHeatmap sessions={sessions} />
      <CalendarView sessions={sessions} />
      <ReadingAnsweringBreakdown sessions={sessions} />
    </div>
  );
}
