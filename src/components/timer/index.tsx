import { AnimatePresence } from "motion/react";
import type { Status, LearningPhase, Session } from "../../types";
import { WelcomeHero, MotivationalQuote } from "./WelcomeHero";
import { TimerDisplay } from "./TimerDisplay";
import { SubTimerPanel } from "./SubTimerPanel";
import { TimerControls } from "./TimerControls";
import { SessionList } from "./SessionList";

interface Props {
  status: Status;
  seconds: number;
  learningPhase: LearningPhase;
  readingSeconds: number;
  answeringSeconds: number;
  activeSubject: string | null;
  sessions: Session[];
  canUndo: boolean;
  canRedo: boolean;
  onStartLearning: (subject: string) => void;
  onStartBreak: () => void;
  onStartPersonal: () => void;
  onStop: () => void;
  onSwitchToAnswering: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function TimerView({
  status,
  seconds,
  learningPhase,
  readingSeconds,
  answeringSeconds,
  activeSubject,
  sessions,
  canUndo,
  canRedo,
  onStartLearning,
  onStartBreak,
  onStartPersonal,
  onStop,
  onSwitchToAnswering,
  onUndo,
  onRedo,
}: Props) {
  return (
    <div className="space-y-12 relative z-10">
      <WelcomeHero />

      <TimerDisplay
        status={status}
        learningPhase={learningPhase}
        seconds={seconds}
        activeSubject={activeSubject}
      />

      <AnimatePresence>
        {status === "learning" && (
          <SubTimerPanel
            learningPhase={learningPhase}
            readingSeconds={readingSeconds}
            answeringSeconds={answeringSeconds}
            onSwitchToAnswering={onSwitchToAnswering}
          />
        )}
      </AnimatePresence>

      <TimerControls
        status={status}
        onStartLearning={onStartLearning}
        onStartBreak={onStartBreak}
        onStartPersonal={onStartPersonal}
        onStop={onStop}
      />

      <SessionList
        sessions={sessions}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />

      <MotivationalQuote />
    </div>
  );
}
