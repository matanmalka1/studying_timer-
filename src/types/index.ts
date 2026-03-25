export type Status = 'idle' | 'learning' | 'break' | 'personal';
export type View = 'timer' | 'stats';
export type LearningPhase = 'reading' | 'answering';

export interface Session {
  id: string;
  type: Status;
  subject?: string;
  duration: number; // seconds – total
  readingDuration?: number; // seconds – reading phase
  answeringDuration?: number; // seconds – answering phase
  timestamp: number;
}

export interface AppSettings {
  learningDuration: number;
  breakDuration: number;
  personalDuration: number;
  isCountdownMode: boolean;
  isPomodoroMode: boolean;
  pomodoroWork: number;
  pomodoroBreak: number;
}
