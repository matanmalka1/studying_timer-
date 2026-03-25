/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon,
  LibraryBig,
  BookOpen,
  Coffee as CoffeeIcon,
  Footprints,
  StopCircle as StopIcon,
  Download as DownloadIcon,
  Quote,
  X,
  Check,
  BarChart2,
  Timer,
  Undo2,
  Redo2,
  Flame,
  Trophy,
  History,
  Heart,
  Sparkles,
  Flower2,
  BookMarked,
  PenLine,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  subDays,
  startOfMonth,
  endOfMonth,
  isToday,
  addMonths,
  subMonths,
  isAfter,
  startOfDay,
} from 'date-fns';
import { he } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'learning' | 'break' | 'personal';
type View = 'timer' | 'stats';
/** Which sub-phase is active inside a learning session */
type LearningPhase = 'reading' | 'answering';

interface Session {
  id: string;
  type: Status;
  subject?: string;
  duration: number; // seconds – total
  readingDuration?: number; // seconds – reading phase
  answeringDuration?: number; // seconds – answering phase
  timestamp: number;
}

interface AppSettings {
  learningDuration: number;
  breakDuration: number;
  personalDuration: number;
  isCountdownMode: boolean;
  isPomodoroMode: boolean;
  pomodoroWork: number;
  pomodoroBreak: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECTS = [
  'סדר דין אזרחי',
  'סדר דין פלילי',
  'דיני ראיות',
  'דיני עונשין',
  'דיני קניין',
  'דיני חוזים',
  'דיני נזיקין',
  'דיני משפחה',
  'דיני ירושה',
  'אתיקה מקצועית',
  'משפט חוקתי',
  'משפט מנהלי',
  'דיני עבודה',
  'דיני תאגידים',
  'הוצאה לפועל',
  'חדלות פירעון',
  'מיסוי מקרקעין',
  'דיני בנקאות',
  'דיני בוררות',
  'דיני הגנת הצרכן',
  'תובענות ייצוגיות',
];

const DEFAULT_SETTINGS: AppSettings = {
  learningDuration: 50,
  breakDuration: 10,
  personalDuration: 30,
  isCountdownMode: false,
  isPomodoroMode: false,
  pomodoroWork: 25,
  pomodoroBreak: 5,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const h = Math.floor(s / 3600).toString().padStart(2, '0');
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function formatTimeShort(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  if (s < 3600) return `${m}:${sec}`;
  const h = Math.floor(s / 3600);
  return `${h}:${m}:${sec}`;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>('timer');
  const [status, setStatus] = useState<Status>('idle');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  // Main timer (counts total learning / break / personal time)
  const [seconds, setSeconds] = useState(0);

  // Sub-timer – only active during 'learning'
  const [learningPhase, setLearningPhase] = useState<LearningPhase>('reading');
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [answeringSeconds, setAnsweringSeconds] = useState(0);
  const [subTimerVisible, setSubTimerVisible] = useState(true);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [history, setHistory] = useState<Session[][]>([]);
  const [redoStack, setRedoStack] = useState<Session[][]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Keeps a live reference to readingSeconds / answeringSeconds for use inside
  // the interval callback without stale closure issues.
  const phaseRef = useRef<{ phase: LearningPhase; reading: number; answering: number }>({
    phase: 'reading',
    reading: 0,
    answering: 0,
  });

  // Sync ref on every render
  phaseRef.current = { phase: learningPhase, reading: readingSeconds, answering: answeringSeconds };

  // ── Persist ──────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const s = localStorage.getItem('pass_the_bar_sessions');
      if (s) setSessions(JSON.parse(s));
    } catch { /* ignore */ }

    try {
      const s = localStorage.getItem('pass_the_bar_settings');
      if (s) setSettings(JSON.parse(s));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem('pass_the_bar_sessions', JSON.stringify(sessions));
    }, 1000);
    return () => clearTimeout(id);
  }, [sessions]);

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem('pass_the_bar_settings', JSON.stringify(settings));
    }, 1000);
    return () => clearTimeout(id);
  }, [settings]);

  // ── Audio ────────────────────────────────────────────────────────────────

  const playSound = (type: 'start' | 'end' | 'switch') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime({ start: 880, end: 440, switch: 660 }[type], ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch { /* ignore */ }
  };

  // ── Main timer tick ───────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== 'idle') {
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (settings.isCountdownMode && prev <= 0) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return settings.isCountdownMode ? prev - 1 : prev + 1;
        });

        // Sub-timer: only increment when learning
        if (status === 'learning') {
          const { phase } = phaseRef.current;
          if (phase === 'reading') {
            setReadingSeconds(r => r + 1);
          } else {
            setAnsweringSeconds(a => a + 1);
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, settings.isCountdownMode]);

  // ── Session management ────────────────────────────────────────────────────

  const buildSession = (): Session | null => {
    let duration = seconds;
    if (settings.isPomodoroMode || settings.isCountdownMode) {
      const initialMap = {
        learning: settings.isPomodoroMode ? settings.pomodoroWork : settings.learningDuration,
        break: settings.isPomodoroMode ? settings.pomodoroBreak : settings.breakDuration,
        personal: settings.personalDuration,
        idle: 0,
      };
      duration = initialMap[status] * 60 - seconds;
    }
    if (duration <= 0) return null;

    return {
      id: Math.random().toString(36).substr(2, 9),
      type: status,
      subject: activeSubject ?? undefined,
      duration,
      ...(status === 'learning'
        ? {
            readingDuration: readingSeconds,
            answeringDuration: answeringSeconds,
          }
        : {}),
      timestamp: Date.now(),
    };
  };

  const commitSession = () => {
    const session = buildSession();
    if (!session) return;
    setHistory(prev => [sessions, ...prev].slice(0, 20));
    setRedoStack([]);
    setSessions(prev => [session, ...prev]);
  };

  // ── Controls ──────────────────────────────────────────────────────────────

  const resetSubTimers = () => {
    setReadingSeconds(0);
    setAnsweringSeconds(0);
    setLearningPhase('reading');
  };

  const startSession = (newStatus: Status, subject: string | null = null) => {
    if (status !== 'idle') {
      commitSession();
      playSound('switch');
    } else {
      playSound('start');
    }

    setStatus(newStatus);
    setActiveSubject(subject);
    resetSubTimers();
    setSubTimerVisible(true);

    const durationMap = {
      learning: settings.isPomodoroMode ? settings.pomodoroWork : settings.learningDuration,
      break: settings.isPomodoroMode ? settings.pomodoroBreak : settings.breakDuration,
      personal: settings.personalDuration,
      idle: 0,
    };

    if (settings.isPomodoroMode || settings.isCountdownMode) {
      setSeconds(durationMap[newStatus] * 60);
    } else {
      setSeconds(0);
    }

    setShowDropdown(false);
  };

  const handleStartLearning = (subject: string) => startSession('learning', subject);
  const handleStartBreak = () => startSession('break');
  const handleStartPersonal = () => startSession('personal');

  const handleStop = () => {
    if (status !== 'idle') {
      commitSession();
      playSound('end');
    }
    setStatus('idle');
    setActiveSubject(null);
    setSeconds(0);
    resetSubTimers();
  };

  /** Switch from reading phase → answering phase */
  const handleSwitchToAnswering = () => {
    setLearningPhase('answering');
  };

  const undo = () => {
    if (!history.length) return;
    setRedoStack(prev => [sessions, ...prev]);
    setSessions(history[0]);
    setHistory(prev => prev.slice(1));
  };

  const redo = () => {
    if (!redoStack.length) return;
    setHistory(prev => [sessions, ...prev]);
    setSessions(redoStack[0]);
    setRedoStack(prev => prev.slice(1));
  };

  // ── Derived display ───────────────────────────────────────────────────────

  const getStatusText = () => {
    switch (status) {
      case 'learning': return learningPhase === 'reading' ? 'בקריאת המשימה...' : 'בכתיבת תשובה...';
      case 'break': return 'בהפסקה...';
      case 'personal': return 'בזמן אישי...';
      default: return 'במצב המתנה';
    }
  };

  const getStatusDot = () => {
    switch (status) {
      case 'learning': return learningPhase === 'reading' ? 'bg-primary' : 'bg-secondary';
      case 'break': return 'bg-secondary';
      case 'personal': return 'bg-tertiary-fixed';
      default: return 'bg-outline';
    }
  };

  // ── Stats view ────────────────────────────────────────────────────────────

  const StatsView = () => {
    const [calendarDate, setCalendarDate] = useState(new Date());

    const totalLearningSeconds = sessions
      .filter(s => s.type === 'learning')
      .reduce((acc, s) => acc + s.duration, 0);

    const calculateStreak = () => {
      if (!sessions.length) return 0;
      const learningDays = sessions
        .filter(s => s.type === 'learning')
        .map(s => startOfDay(new Date(s.timestamp)).getTime());
      const uniqueDays = Array.from(new Set(learningDays)).sort((a: number, b: number) => b - a);
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
    };

    const streak = calculateStreak();

    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    const chartData = last7Days.map(date => {
      const daySessions = sessions.filter(
        s => isSameDay(new Date(s.timestamp), date) && s.type === 'learning'
      );
      return {
        name: format(date, 'EEE', { locale: he }),
        hours: Number((daySessions.reduce((acc, s) => acc + s.duration, 0) / 3600).toFixed(1)),
      };
    });

    const getDayStats = (date: Date) => {
      const daySessions = sessions.filter(
        s => isSameDay(new Date(s.timestamp), date) && s.type === 'learning'
      );
      const totalSeconds = daySessions.reduce((acc, s) => acc + s.duration, 0);
      return { totalSeconds, hours: totalSeconds / 3600 };
    };

    const getCalendarDays = () => {
      const start = startOfWeek(startOfMonth(calendarDate));
      const end = endOfWeek(endOfMonth(calendarDate));
      return eachDayOfInterval({ start, end });
    };

    const calendarDays = getCalendarDays();
    const weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

    const yearlyData = Array.from({ length: 52 }, (_, weekIndex) => {
      const weekStart = startOfWeek(subDays(new Date(), (51 - weekIndex) * 7));
      return Array.from({ length: 7 }, (_, dayIndex) => {
        const date = subDays(weekStart, -dayIndex);
        return { date, stats: getDayStats(date) };
      });
    });

    // Reading vs answering breakdown for recent sessions
    const subPhaseSessions = sessions.filter(
      s => s.type === 'learning' && s.readingDuration !== undefined
    ).slice(0, 10);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 pb-24"
      >
        {/* Summary cards */}
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

        {/* Reading vs Answering breakdown */}
        {subPhaseSessions.length > 0 && (
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
                      <span className="tabular-nums">
                        {format(new Date(s.timestamp), 'dd/MM HH:mm')}
                      </span>
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
        )}

        {/* Yearly heatmap */}
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

        {/* Calendar */}
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
              <div
                key={day}
                className="text-center text-[10px] font-bold text-on-surface-variant py-2"
              >
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
                  <span
                    className={`text-[10px] font-bold ${stats.hours > 0.5 ? 'text-on-primary' : 'text-on-surface'}`}
                  >
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

        {/* Weekly bar chart */}
        <section className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-6">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            מגמת למידה שבועית
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-primary-container)',
                    borderRadius: '16px',
                    color: 'var(--color-on-surface)',
                  }}
                />
                <Bar dataKey="hours" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Activity log */}
        <section className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-4 mb-20">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            היסטוריית פעילות
          </h3>
          <div className="space-y-3">
            {sessions.slice(0, 8).map(s => (
              <div key={s.id} className="flex items-start justify-between text-sm gap-2">
                <span className="text-on-surface-variant shrink-0">
                  {format(new Date(s.timestamp), 'dd/MM HH:mm')}
                </span>
                <div className="flex flex-col items-end gap-0.5 text-left">
                  <span className="font-bold">
                    {s.type === 'learning'
                      ? s.subject
                      : s.type === 'break'
                      ? 'הפסקה'
                      : 'אישי'}
                  </span>
                  {s.readingDuration !== undefined && (
                    <span className="text-[10px] text-on-surface-variant flex gap-2">
                      <span>📖 {formatTimeShort(s.readingDuration)}</span>
                      <span>✍️ {formatTimeShort(s.answeringDuration ?? 0)}</span>
                    </span>
                  )}
                </div>
                <span className="tabular-nums opacity-70 shrink-0">{formatTime(s.duration)}</span>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md text-primary font-headline flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto sticky top-0 z-50 border-b border-primary/10">
        <div className="flex items-center gap-4">
          <SettingsIcon
            onClick={() => setShowSettings(true)}
            className="text-primary hover:bg-primary-container transition-colors p-2 rounded-full cursor-pointer w-10 h-10"
          />
          <LibraryBig className="text-primary hover:bg-primary-container transition-colors p-2 rounded-full cursor-pointer w-10 h-10" />
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <h1 className="text-xl font-bold text-on-surface tracking-tight italic">PassTheBar</h1>
          </div>
          <p className="text-[10px] text-primary font-medium opacity-70">הליווי השקט שלך להצלחה</p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 md:py-16 relative">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-40 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

        {view === 'timer' ? (
          <div className="space-y-12 relative z-10">
            {/* Welcome */}
            <section className="text-center space-y-4">
              <div className="flex justify-center gap-3 mb-2">
                <Flower2 className="text-primary w-6 h-6 animate-bounce" />
                <Heart className="text-primary w-6 h-6 fill-primary" />
                <Flower2 className="text-primary w-6 h-6 animate-bounce" />
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight font-headline">
                בהצלחה במבחני הלשכה, אהובה! ✨
              </h2>
              <h3 className="text-2xl md:text-3xl font-bold text-primary tracking-tight italic">
                אוהב אותך המון, בעלך!!
              </h3>
              <p className="text-on-surface-variant font-medium opacity-80 max-w-md mx-auto">
                כל דקה של למידה מקרבת אותך להצלחה הגדולה שלך.
              </p>
            </section>

            {/* ── Main Timer ── */}
            <section className="relative flex flex-col items-center justify-center py-8">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-full blur-3xl opacity-30 pointer-events-none" />
              <div className="relative z-10 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-outline-variant/15">
                  <span
                    className={`w-2 h-2 rounded-full ${getStatusDot()} ${status !== 'idle' ? 'animate-pulse' : ''}`}
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

            {/* ── Sub-timer panel (learning only) ── */}
            <AnimatePresence>
              {status === 'learning' && (
                <motion.section
                  key="sub-timer"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-primary/20 bg-surface-container-low shadow-lg overflow-hidden">
                    {/* Panel header */}
                    <button
                      onClick={() => setSubTimerVisible(v => !v)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-container-high transition-colors"
                    >
                      <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <Timer className="w-4 h-4 text-primary" />
                        ניתוח זמן משימה
                      </span>
                      {subTimerVisible ? (
                        <ChevronUp className="w-4 h-4 text-on-surface-variant" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                      )}
                    </button>

                    <AnimatePresence>
                      {subTimerVisible && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-4">
                            {/* Two phase clocks */}
                            <div className="grid grid-cols-2 gap-3">
                              {/* Reading */}
                              <div
                                className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                                  learningPhase === 'reading'
                                    ? 'bg-primary/15 border-2 border-primary shadow-sm'
                                    : 'bg-surface-container-high border-2 border-transparent opacity-60'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <BookMarked
                                    className={`w-4 h-4 ${learningPhase === 'reading' ? 'text-primary' : 'text-on-surface-variant'}`}
                                  />
                                  <span className="text-xs font-bold text-on-surface-variant">
                                    קריאת המשימה
                                  </span>
                                </div>
                                <span
                                  className={`text-2xl font-black tabular-nums font-headline ${
                                    learningPhase === 'reading' ? 'text-primary' : 'text-on-surface'
                                  }`}
                                >
                                  {formatTimeShort(readingSeconds)}
                                </span>
                                {learningPhase === 'reading' && (
                                  <span className="text-[10px] text-primary/70 font-semibold animate-pulse">
                                    ● פעיל
                                  </span>
                                )}
                              </div>

                              {/* Answering */}
                              <div
                                className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                                  learningPhase === 'answering'
                                    ? 'bg-secondary/15 border-2 border-secondary shadow-sm'
                                    : 'bg-surface-container-high border-2 border-transparent opacity-60'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <PenLine
                                    className={`w-4 h-4 ${learningPhase === 'answering' ? 'text-secondary' : 'text-on-surface-variant'}`}
                                  />
                                  <span className="text-xs font-bold text-on-surface-variant">
                                    כתיבת תשובה
                                  </span>
                                </div>
                                <span
                                  className={`text-2xl font-black tabular-nums font-headline ${
                                    learningPhase === 'answering' ? 'text-secondary' : 'text-on-surface'
                                  }`}
                                >
                                  {formatTimeShort(answeringSeconds)}
                                </span>
                                {learningPhase === 'answering' && (
                                  <span className="text-[10px] text-secondary/70 font-semibold animate-pulse">
                                    ● פעיל
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Progress bar */}
                            {(readingSeconds + answeringSeconds) > 0 && (
                              <div className="space-y-1">
                                <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                                  <div
                                    className="bg-primary transition-all duration-500"
                                    style={{
                                      width: `${
                                        (readingSeconds /
                                          (readingSeconds + answeringSeconds + 0.001)) *
                                        100
                                      }%`,
                                    }}
                                  />
                                  <div
                                    className="bg-secondary transition-all duration-500"
                                    style={{
                                      width: `${
                                        (answeringSeconds /
                                          (readingSeconds + answeringSeconds + 0.001)) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-on-surface-variant">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                                    קריאה
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
                                    תשובה
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Switch button – only visible during reading phase */}
                            <AnimatePresence>
                              {learningPhase === 'reading' && (
                                <motion.button
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 6 }}
                                  onClick={handleSwitchToAnswering}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-on-secondary font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                                >
                                  <PenLine className="w-4 h-4" />
                                  עבור לכתיבת תשובה
                                  <ArrowLeft className="w-4 h-4" />
                                </motion.button>
                              )}
                            </AnimatePresence>

                            {learningPhase === 'answering' && (
                              <div className="text-center text-xs text-on-surface-variant opacity-70">
                                שלב כתיבת התשובה פעיל • לחץ על "סיום יום" לשמירה
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Controls */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl transition-all duration-300 active:scale-[0.98] ${
                    status === 'learning'
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container-high hover:bg-primary-container text-on-surface'
                  }`}
                >
                  <BookOpen className="w-8 h-8" />
                  <span className="font-bold">למידה</span>
                </button>
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 w-full glass rounded-xl border border-outline-variant/15 shadow-2xl z-40 overflow-hidden"
                    >
                      <div className="max-h-60 overflow-y-auto no-scrollbar p-2 space-y-1">
                        {SUBJECTS.map(subject => (
                          <button
                            key={subject}
                            className="w-full text-right px-4 py-2.5 rounded-lg hover:bg-primary/20 text-sm transition-colors"
                            onClick={() => handleStartLearning(subject)}
                          >
                            {subject}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleStartBreak}
                className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl transition-all duration-300 active:scale-[0.98] ${
                  status === 'break'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-surface-container-high hover:bg-secondary-container text-on-surface'
                }`}
              >
                <CoffeeIcon className="w-8 h-8" />
                <span className="font-bold">הפסקה</span>
              </button>

              <button
                onClick={handleStartPersonal}
                className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl transition-all duration-300 active:scale-[0.98] ${
                  status === 'personal'
                    ? 'bg-tertiary-container text-on-tertiary-container'
                    : 'bg-surface-container-high hover:bg-tertiary-container/30 text-on-surface'
                }`}
              >
                <Footprints className="w-8 h-8" />
                <span className="font-bold">אישי</span>
              </button>

              <button
                onClick={handleStop}
                className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl bg-surface-container-high hover:bg-error-container/40 text-on-surface transition-all duration-300 active:scale-[0.98]"
              >
                <StopIcon className="w-8 h-8" />
                <span className="font-bold">סיום יום</span>
              </button>
            </section>

            {/* Daily summary */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-on-surface">סיכום יומי</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={undo}
                    disabled={!history.length}
                    className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors border border-outline-variant/15"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={!redoStack.length}
                    className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors border border-outline-variant/15"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/15 text-xs font-semibold">
                    <DownloadIcon className="w-4 h-4" />
                    ייצוא נתונים
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {!sessions.length && (
                  <div className="text-center py-8 text-on-surface-variant opacity-50 italic">
                    אין נתונים להצגה. התחל ללמוד!
                  </div>
                )}
                {sessions.map(session => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={session.id}
                    className="flex items-center justify-between p-5 bg-surface-container-low rounded-xl relative overflow-hidden"
                  >
                    <div
                      className={`absolute right-0 top-0 bottom-0 w-1 ${
                        session.type === 'learning'
                          ? 'bg-primary'
                          : session.type === 'break'
                          ? 'bg-secondary'
                          : 'bg-tertiary-fixed'
                      }`}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-on-surface font-bold">
                        {session.type === 'learning'
                          ? session.subject
                          : session.type === 'break'
                          ? 'הפסקה'
                          : 'אישי'}
                      </span>
                      {session.readingDuration !== undefined && (
                        <span className="text-[11px] text-on-surface-variant flex gap-3">
                          <span className="flex items-center gap-1">
                            <BookMarked className="w-3 h-3 text-primary" />
                            {formatTimeShort(session.readingDuration)}
                          </span>
                          <span className="flex items-center gap-1">
                            <PenLine className="w-3 h-3 text-secondary" />
                            {formatTimeShort(session.answeringDuration ?? 0)}
                          </span>
                        </span>
                      )}
                      <span className="text-xs text-on-surface-variant opacity-60">
                        {session.type === 'learning'
                          ? 'למידה פעילה'
                          : session.type === 'break'
                          ? 'מנוחה והתרעננות'
                          : 'סידורים וזמן פרטי'}
                      </span>
                    </div>
                    <div
                      className={`text-lg font-headline font-bold ${
                        session.type === 'learning'
                          ? 'text-primary'
                          : session.type === 'break'
                          ? 'text-secondary'
                          : 'text-tertiary-fixed'
                      }`}
                    >
                      {formatTime(session.duration)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Quote */}
            <section className="p-10 rounded-[2.5rem] bg-gradient-to-br from-primary-container to-surface border border-primary/20 text-center space-y-6 shadow-2xl relative overflow-hidden mb-28">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Flower2 className="w-24 h-24" />
              </div>
              <Quote className="text-primary w-12 h-12 mx-auto opacity-40" />
              <p className="text-xl md:text-2xl font-bold italic text-on-surface leading-relaxed font-headline">
                "את חזקה, את חכמה, ואת הולכת לעבור את זה בגדול. כל מאמץ קטן היום הוא הניצחון של מחר."
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="h-[2px] w-8 bg-primary/30 rounded-full" />
                <Heart className="w-4 h-4 text-primary fill-primary" />
                <div className="h-[2px] w-8 bg-primary/30 rounded-full" />
              </div>
            </section>
          </div>
        ) : (
          <StatsView />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-primary/10 px-6 py-4 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button
            onClick={() => setView('timer')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              view === 'timer' ? 'text-primary scale-110' : 'text-on-surface-variant opacity-60'
            }`}
          >
            <Timer className="w-6 h-6" />
            <span className="text-[10px] font-bold">טיימר</span>
          </button>
          <button
            onClick={() => setView('stats')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              view === 'stats' ? 'text-primary scale-110' : 'text-on-surface-variant opacity-60'
            }`}
          >
            <BarChart2 className="w-6 h-6" />
            <span className="text-[10px] font-bold">סטטיסטיקה</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center gap-1 text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity"
          >
            <SettingsIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold">הגדרות</span>
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface-container-low rounded-3xl border border-outline-variant/15 shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-6 h-6 text-primary fill-primary" />
                    <h2 className="text-2xl font-bold text-on-surface font-headline italic">
                      הגדרות אישיות
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-primary-container rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-on-surface-variant" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-2xl">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface">מצב ספירה לאחור</span>
                      <span className="text-xs text-on-surface-variant">החלף בין שעון עצר לטיימר</span>
                    </div>
                    <button
                      onClick={() =>
                        setSettings(prev => ({
                          ...prev,
                          isCountdownMode: !prev.isCountdownMode,
                          isPomodoroMode: false,
                        }))
                      }
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        settings.isCountdownMode ? 'bg-primary' : 'bg-outline'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.isCountdownMode ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-2xl">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface">מצב פומודורו</span>
                      <span className="text-xs text-on-surface-variant">25 דקות עבודה, 5 דקות הפסקה</span>
                    </div>
                    <button
                      onClick={() =>
                        setSettings(prev => ({
                          ...prev,
                          isPomodoroMode: !prev.isPomodoroMode,
                          isCountdownMode: false,
                        }))
                      }
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        settings.isPomodoroMode ? 'bg-primary' : 'bg-outline'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.isPomodoroMode ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>

                  {!settings.isPomodoroMode && (
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'למידה', key: 'learningDuration' as const },
                        { label: 'הפסקה', key: 'breakDuration' as const },
                        { label: 'אישי', key: 'personalDuration' as const },
                      ].map(({ label, key }) => (
                        <div key={key} className="space-y-2">
                          <label className="text-xs font-bold text-on-surface-variant pr-2">
                            {label}
                          </label>
                          <input
                            type="number"
                            value={settings[key]}
                            onChange={e =>
                              setSettings(prev => ({
                                ...prev,
                                [key]: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="w-full bg-surface-container-high border-none rounded-xl p-3 text-center font-bold focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {settings.isPomodoroMode && (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "עבודה (דק')", key: 'pomodoroWork' as const },
                        { label: "הפסקה (דק')", key: 'pomodoroBreak' as const },
                      ].map(({ label, key }) => (
                        <div key={key} className="space-y-2">
                          <label className="text-xs font-bold text-on-surface-variant pr-2">
                            {label}
                          </label>
                          <input
                            type="number"
                            value={settings[key]}
                            onChange={e =>
                              setSettings(prev => ({
                                ...prev,
                                [key]: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="w-full bg-surface-container-high border-none rounded-xl p-3 text-center font-bold focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl hover:bg-primary-dim transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  שמור שינויים
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
