import { useState, useEffect, useRef } from "react";
import type { Status, LearningPhase, Session, AppSettings } from "../types";
import { playSound, generateId } from "../utils";

interface UseTimerReturn {
  status: Status;
  seconds: number;
  learningPhase: LearningPhase;
  readingSeconds: number;
  answeringSeconds: number;
  activeSubject: string | null;
  startSession: (newStatus: Status, subject?: string | null) => void;
  handleStop: () => void;
  handleSwitchToAnswering: () => void;
  buildSession: () => Session | null;
}

export function useTimer(
  settings: AppSettings,
  onSessionComplete: (session: Session) => void,
): UseTimerReturn {
  const [status, setStatus] = useState<Status>("idle");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [learningPhase, setLearningPhase] = useState<LearningPhase>("reading");
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [answeringSeconds, setAnsweringSeconds] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef<{
    phase: LearningPhase;
    reading: number;
    answering: number;
  }>({
    phase: "reading",
    reading: 0,
    answering: 0,
  });

  // Keep ref in sync
  phaseRef.current = {
    phase: learningPhase,
    reading: readingSeconds,
    answering: answeringSeconds,
  };

  useEffect(() => {
    if (status !== "idle") {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (settings.isCountdownMode && prev <= 0) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return settings.isCountdownMode ? prev - 1 : prev + 1;
        });

        if (status === "learning") {
          const { phase } = phaseRef.current;
          if (phase === "reading") {
            setReadingSeconds((r) => r + 1);
          } else {
            setAnsweringSeconds((a) => a + 1);
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, settings.isCountdownMode]);

  const getDurationForStatus = (s: Status): number => {
    const map = {
      learning: settings.isPomodoroMode
        ? settings.pomodoroWork
        : settings.learningDuration,
      break: settings.isPomodoroMode
        ? settings.pomodoroBreak
        : settings.breakDuration,
      personal: settings.personalDuration,
      idle: 0,
    };
    return map[s];
  };

  const buildSession = (): Session | null => {
    let duration = seconds;
    if (settings.isPomodoroMode || settings.isCountdownMode) {
      duration = getDurationForStatus(status) * 60 - seconds;
    }
    if (duration <= 0) return null;

    return {
      id: generateId(),
      type: status,
      subject: activeSubject ?? undefined,
      duration,
      ...(status === "learning"
        ? {
            readingDuration: readingSeconds,
            answeringDuration: answeringSeconds,
          }
        : {}),
      timestamp: Date.now(),
    };
  };

  const resetSubTimers = () => {
    setReadingSeconds(0);
    setAnsweringSeconds(0);
    setLearningPhase("reading");
  };

  const commitSession = () => {
    const session = buildSession();
    if (session) onSessionComplete(session);
  };

  const startSession = (newStatus: Status, subject: string | null = null) => {
    if (status !== "idle") {
      commitSession();
      playSound("switch");
    } else {
      playSound("start");
    }

    setStatus(newStatus);
    setActiveSubject(subject);
    resetSubTimers();

    if (settings.isPomodoroMode || settings.isCountdownMode) {
      setSeconds(getDurationForStatus(newStatus) * 60);
    } else {
      setSeconds(0);
    }
  };

  const handleStop = () => {
    if (status !== "idle") {
      commitSession();
      playSound("end");
    }
    setStatus("idle");
    setActiveSubject(null);
    setSeconds(0);
    resetSubTimers();
  };

  const handleSwitchToAnswering = () => {
    setLearningPhase("answering");
  };

  return {
    status,
    seconds,
    learningPhase,
    readingSeconds,
    answeringSeconds,
    activeSubject,
    startSession,
    handleStop,
    handleSwitchToAnswering,
    buildSession,
  };
}
