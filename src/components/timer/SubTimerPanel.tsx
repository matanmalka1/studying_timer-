import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, BookMarked, PenLine, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { LearningPhase } from '../../types';
import { formatTimeShort } from '../../utils';

interface Props {
  learningPhase: LearningPhase;
  readingSeconds: number;
  answeringSeconds: number;
  onSwitchToAnswering: () => void;
}

export function SubTimerPanel({
  learningPhase,
  readingSeconds,
  answeringSeconds,
  onSwitchToAnswering,
}: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const total = readingSeconds + answeringSeconds + 0.001;

  return (
    <motion.section
      key="sub-timer"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-primary/20 bg-surface-container-low shadow-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsVisible(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-container-high transition-colors"
        >
          <span className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            ניתוח זמן משימה
          </span>
          {isVisible ? (
            <ChevronUp className="w-4 h-4 text-on-surface-variant" />
          ) : (
            <ChevronDown className="w-4 h-4 text-on-surface-variant" />
          )}
        </button>

        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4">
                {/* Phase clocks */}
                <div className="grid grid-cols-2 gap-3">
                  <PhaseCard
                    label="קריאת המשימה"
                    icon={<BookMarked className={`w-4 h-4 ${learningPhase === 'reading' ? 'text-primary' : 'text-on-surface-variant'}`} />}
                    seconds={readingSeconds}
                    isActive={learningPhase === 'reading'}
                    activeColor="primary"
                  />
                  <PhaseCard
                    label="כתיבת תשובה"
                    icon={<PenLine className={`w-4 h-4 ${learningPhase === 'answering' ? 'text-secondary' : 'text-on-surface-variant'}`} />}
                    seconds={answeringSeconds}
                    isActive={learningPhase === 'answering'}
                    activeColor="secondary"
                  />
                </div>

                {/* Progress bar */}
                {(readingSeconds + answeringSeconds) > 0 && (
                  <div className="space-y-1">
                    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                      <div
                        className="bg-primary transition-all duration-500"
                        style={{ width: `${(readingSeconds / total) * 100}%` }}
                      />
                      <div
                        className="bg-secondary transition-all duration-500"
                        style={{ width: `${(answeringSeconds / total) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary inline-block" />קריאה
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-secondary inline-block" />תשובה
                      </span>
                    </div>
                  </div>
                )}

                {/* Switch button */}
                <AnimatePresence>
                  {learningPhase === 'reading' ? (
                    <motion.button
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      onClick={onSwitchToAnswering}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-on-secondary font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                    >
                      <PenLine className="w-4 h-4" />
                      עבור לכתיבת תשובה
                      <ArrowLeft className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-xs text-on-surface-variant opacity-70"
                    >
                      שלב כתיבת התשובה פעיל • לחץ על "סיום יום" לשמירה
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

interface PhaseCardProps {
  label: string;
  icon: React.ReactNode;
  seconds: number;
  isActive: boolean;
  activeColor: 'primary' | 'secondary';
}

function PhaseCard({ label, icon, seconds, isActive, activeColor }: PhaseCardProps) {
  return (
    <div
      className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
        isActive
          ? `bg-${activeColor}/15 border-2 border-${activeColor} shadow-sm`
          : 'bg-surface-container-high border-2 border-transparent opacity-60'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-bold text-on-surface-variant">{label}</span>
      </div>
      <span className={`text-2xl font-black tabular-nums font-headline ${isActive ? `text-${activeColor}` : 'text-on-surface'}`}>
        {formatTimeShort(seconds)}
      </span>
      {isActive && (
        <span className={`text-[10px] text-${activeColor}/70 font-semibold animate-pulse`}>
          ● פעיל
        </span>
      )}
    </div>
  );
}
