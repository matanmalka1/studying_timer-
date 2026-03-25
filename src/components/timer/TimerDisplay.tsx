import { motion, AnimatePresence } from 'motion/react';
import type { Status, LearningPhase } from '../../types';
import { formatTime } from '../../utils';

interface Props {
  status: Status;
  learningPhase: LearningPhase;
  seconds: number;
  activeSubject: string | null;
}

export function TimerDisplay({ status, learningPhase, seconds, activeSubject }: Props) {
  const getStatusText = () => {
    switch (status) {
      case 'learning': return learningPhase === 'reading' ? 'בקריאת המשימה...' : 'בכתיבת תשובה...';
      case 'break': return 'בהפסקה...';
      case 'personal': return 'בזמן אישי...';
      default: return 'במצב המתנה';
    }
  };

  const getDotClass = () => {
    switch (status) {
      case 'learning': return learningPhase === 'reading' ? 'bg-primary' : 'bg-secondary';
      case 'break': return 'bg-secondary';
      case 'personal': return 'bg-tertiary-fixed';
      default: return 'bg-outline';
    }
  };

  return (
    <section className="relative flex flex-col items-center justify-center py-8">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="relative z-10 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-outline-variant/15">
          <span
            className={`w-2 h-2 rounded-full ${getDotClass()} ${status !== 'idle' ? 'animate-pulse' : ''}`}
          />
          <span className="text-sm font-semibold tracking-wide text-primary">
            {getStatusText()}
          </span>
        </div>
        <div className="font-headline text-7xl md:text-9xl font-extrabold tracking-tighter tabular-nums text-on-surface drop-shadow-2xl">
          {formatTime(seconds)}
        </div>
        <AnimatePresence>
          {activeSubject && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-lg font-bold text-on-surface-variant"
            >
              {activeSubject}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
