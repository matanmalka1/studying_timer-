/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
// Note: The user provided HTML uses Material Symbols Outlined. 
// I'll use Lucide icons instead as per my instructions, but I'll try to match the look.
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
  Flower2
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
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
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
  getDay, 
  isToday,
  addMonths,
  subMonths,
  isAfter,
  startOfDay
} from 'date-fns';
import { he } from 'date-fns/locale';

type Status = 'idle' | 'learning' | 'break' | 'personal';
type View = 'timer' | 'stats';

interface Session {
  id: string;
  type: Status;
  subject?: string;
  duration: number; // in seconds
  timestamp: number;
}

interface AppSettings {
  learningDuration: number; // in minutes
  breakDuration: number; // in minutes
  personalDuration: number; // in minutes
  isCountdownMode: boolean;
  isPomodoroMode: boolean;
  pomodoroWork: number;
  pomodoroBreak: number;
}

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
  'מיסוי מקרקעין'
];

const DEFAULT_SETTINGS: AppSettings = {
  learningDuration: 50,
  breakDuration: 10,
  personalDuration: 30,
  isCountdownMode: false,
  isPomodoroMode: false,
  pomodoroWork: 25,
  pomodoroBreak: 5
};

export default function App() {
  const [view, setView] = useState<View>('timer');
  const [status, setStatus] = useState<Status>('idle');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [history, setHistory] = useState<Session[][]>([]);
  const [redoStack, setRedoStack] = useState<Session[][]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [flash, setFlash] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio feedback
  const playSound = (type: 'start' | 'end' | 'switch') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const frequencies = {
        start: 880,
        end: 440,
        switch: 660
      };

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequencies[type], audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio feedback failed', e);
    }
  };

  // Load data from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('pass_the_bar_sessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error('Failed to parse sessions', e);
      }
    }

    const savedSettings = localStorage.getItem('pass_the_bar_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, []);

  // Save data to localStorage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('pass_the_bar_sessions', JSON.stringify(sessions));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [sessions]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('pass_the_bar_settings', JSON.stringify(settings));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [settings]);

  // Timer logic
  useEffect(() => {
    if (status !== 'idle') {
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (settings.isCountdownMode) {
            if (prev <= 0) {
              // Timer finished
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, settings.isCountdownMode]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const startSession = (newStatus: Status, subject: string | null = null) => {
    if (status !== 'idle') {
      saveCurrentSession();
      playSound('switch');
    } else {
      playSound('start');
    }
    
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    setStatus(newStatus);
    setActiveSubject(subject);
    
    if (settings.isPomodoroMode) {
      setSeconds((newStatus === 'learning' ? settings.pomodoroWork : settings.pomodoroBreak) * 60);
    } else if (settings.isCountdownMode) {
      const durationMap = {
        learning: settings.learningDuration,
        break: settings.breakDuration,
        personal: settings.personalDuration,
        idle: 0
      };
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
      saveCurrentSession();
      playSound('end');
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    setStatus('idle');
    setActiveSubject(null);
    setSeconds(0);
  };

  const saveCurrentSession = () => {
    let duration = seconds;
    if (settings.isPomodoroMode) {
      const initial = status === 'learning' ? settings.pomodoroWork : settings.pomodoroBreak;
      duration = (initial * 60) - seconds;
    } else if (settings.isCountdownMode) {
      const initialMap = {
        learning: settings.learningDuration,
        break: settings.breakDuration,
        personal: settings.personalDuration,
        idle: 0
      };
      duration = (initialMap[status] * 60) - seconds;
    }

    if (duration <= 0) return;
    
    const newSession: Session = {
      id: Math.random().toString(36).substr(2, 9),
      type: status,
      subject: activeSubject || undefined,
      duration: duration,
      timestamp: Date.now()
    };
    
    setHistory(prev => [sessions, ...prev].slice(0, 20));
    setRedoStack([]);
    setSessions(prev => [newSession, ...prev]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[0];
    setRedoStack(prev => [sessions, ...prev]);
    setSessions(previous);
    setHistory(prev => prev.slice(1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory(prev => [sessions, ...prev]);
    setSessions(next);
    setRedoStack(prev => prev.slice(1));
  };

  const getStatusText = () => {
    switch (status) {
      case 'learning': return 'בלמידה פעילה...';
      case 'break': return 'בהפסקה...';
      case 'personal': return 'בזמן אישי...';
      default: return 'במצב המתנה';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'learning': return 'bg-primary';
      case 'break': return 'bg-secondary';
      case 'personal': return 'bg-tertiary-fixed';
      default: return 'bg-outline';
    }
  };

  const StatsView = () => {
    const [calendarDate, setCalendarDate] = useState(new Date());

    const totalLearningSeconds = sessions
      .filter(s => s.type === 'learning')
      .reduce((acc, s) => acc + s.duration, 0);
    
    // Calculate real streak
    const calculateStreak = () => {
      if (sessions.length === 0) return 0;
      
      const learningDays = sessions
        .filter(s => s.type === 'learning')
        .map(s => startOfDay(new Date(s.timestamp)).getTime());
      
      const uniqueDays = Array.from(new Set(learningDays)).sort((a: number, b: number) => b - a);
      
      if (uniqueDays.length === 0) return 0;
      
      let streak = 0;
      let currentDate = startOfDay(new Date());
      
      // Check if user learned today or yesterday to continue streak
      const lastLearningDay = new Date(uniqueDays[0] as number);
      if (!isSameDay(lastLearningDay, currentDate) && !isSameDay(lastLearningDay, subDays(currentDate, 1))) {
        return 0;
      }

      for (let i = 0; i < uniqueDays.length; i++) {
        const day = new Date(uniqueDays[i] as number);
        const expectedDay = subDays(currentDate, streak);
        
        if (isSameDay(day, expectedDay)) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    };

    const streak = calculateStreak();

    const subjectData = SUBJECTS.map(subject => ({
      name: subject,
      value: sessions
        .filter(s => s.type === 'learning' && s.subject === subject)
        .reduce((acc, s) => acc + s.duration, 0)
    })).filter(d => d.value > 0);

    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    const chartData = last7Days.map(date => {
      const daySessions = sessions.filter(s => isSameDay(new Date(s.timestamp), date) && s.type === 'learning');
      return {
        name: format(date, 'EEE', { locale: he }),
        hours: Number((daySessions.reduce((acc, s) => acc + s.duration, 0) / 3600).toFixed(1))
      };
    });

    const getCalendarDays = () => {
      const start = startOfWeek(startOfMonth(calendarDate));
      const end = endOfWeek(endOfMonth(calendarDate));
      return eachDayOfInterval({ start, end });
    };

    const getDayStats = (date: Date) => {
      const daySessions = sessions.filter(s => isSameDay(new Date(s.timestamp), date) && s.type === 'learning');
      const totalSeconds = daySessions.reduce((acc, s) => acc + s.duration, 0);
      return {
        totalSeconds,
        hours: totalSeconds / 3600
      };
    };

    const calendarDays = getCalendarDays();
    const yearlyData = Array.from({ length: 52 }, (_, weekIndex) => {
      const weekStart = startOfWeek(subDays(new Date(), (51 - weekIndex) * 7));
      return Array.from({ length: 7 }, (_, dayIndex) => {
        const date = subDays(weekStart, -dayIndex);
        return { date, stats: getDayStats(date) };
      });
    });

    const weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 pb-24"
      >
        <section className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-primary-container text-on-primary-container space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <Timer className="w-5 h-5 opacity-70" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">זמן למידה כולל</span>
            </div>
            <div className="text-2xl font-black tabular-nums">
              {Math.floor(totalLearningSeconds / 3600)}ש' {Math.floor((totalLearningSeconds % 3600) / 60)}ד'
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-secondary-container text-on-secondary-container space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <Flame className="w-5 h-5 opacity-70" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">רצף למידה</span>
            </div>
            <div className="text-2xl font-black tabular-nums">
              {streak} ימים
            </div>
          </div>
        </section>

        {/* Yearly Heatmap */}
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
                            : 'var(--color-surface-container-high)' 
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
          <div className="flex items-center justify-end gap-2 text-[10px] text-on-surface-variant">
            <span>פחות</span>
            <div className="w-3 h-3 rounded-[2px] bg-surface-container-high"></div>
            <div className="w-3 h-3 rounded-[2px] bg-primary/30"></div>
            <div className="w-3 h-3 rounded-[2px] bg-primary/60"></div>
            <div className="w-3 h-3 rounded-[2px] bg-primary"></div>
            <span>יותר</span>
          </div>
        </section>

        {/* Calendar View */}
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
              const intensity = Math.min(stats.hours / 4, 1); // Max intensity at 4 hours
              
              return (
                <div 
                  key={i} 
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center relative group transition-all ${!isCurrentMonth ? 'opacity-20' : ''}`}
                  style={{ 
                    backgroundColor: stats.hours > 0 
                      ? `rgba(var(--color-primary-rgb), ${0.1 + intensity * 0.9})` 
                      : 'var(--color-surface-container-high)' 
                  }}
                >
                  <span className={`text-[10px] font-bold ${stats.hours > 0.5 ? 'text-on-primary' : 'text-on-surface'}`}>
                    {format(date, 'd')}
                  </span>
                  {isToday(date) && (
                    <div className="absolute bottom-1 w-1 h-1 bg-secondary rounded-full"></div>
                  )}
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 bg-surface-container-highest text-on-surface text-[10px] p-2 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                    {format(date, 'dd/MM/yyyy', { locale: he })}
                    <br />
                    {stats.hours.toFixed(1)} שעות למידה
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center gap-4 text-[10px] text-on-surface-variant">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-surface-container-high"></div>
              <span>אין למידה</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary/30"></div>
              <span>מעט</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary"></div>
              <span>הרבה (4+ שעות)</span>
            </div>
          </div>
        </section>

        <section className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-6">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            מגמת למידה שבועית
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-primary-container)', borderRadius: '16px', color: 'var(--color-on-surface)', boxShadow: '0 10px 30px rgba(232,160,191,0.1)' }}
                  itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                />
                <Bar dataKey="hours" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="p-6 rounded-3xl bg-surface border border-primary/10 space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline italic">
            <Trophy className="w-5 h-5 text-secondary" />
            הישגים של מלכה 👑
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary-container/30 border border-primary/5">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Heart className="w-6 h-6 fill-primary" />
              </div>
              <div>
                <div className="font-bold text-sm">התמדה של שבוע</div>
                <div className="text-xs text-on-surface-variant">למדת לפחות 4 שעות בכל יום השבוע. גאה בך!</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary-container/30 border border-secondary/5">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm">מומחה סדר דין אזרחי</div>
                <div className="text-xs text-on-surface-variant">השלמת 20 שעות למידה בנושא זה. את אלופה!</div>
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 rounded-3xl bg-surface border border-primary/10 space-y-6 shadow-sm mb-20">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 font-headline italic">
            <History className="w-5 h-5 text-primary" />
            היסטוריית פעילות
          </h3>
          <div className="space-y-3">
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">{format(new Date(s.timestamp), 'dd/MM HH:mm')}</span>
                <span className="font-bold">{s.type === 'learning' ? s.subject : s.type === 'break' ? 'הפסקה' : 'אישי'}</span>
                <span className="tabular-nums opacity-70">{formatTime(s.duration)}</span>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden font-sans" dir="rtl">
      {/* TopAppBar */}
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
        {/* Decorative Background Elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-40 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        {view === 'timer' ? (
          <div className="space-y-16 relative z-10">
            {/* Welcome Header */}
            <section className="text-center space-y-4">
              <div className="flex justify-center gap-3 mb-2">
                <Flower2 className="text-primary w-6 h-6 animate-bounce" />
                <Heart className="text-primary w-6 h-6 fill-primary" />
                <Flower2 className="text-primary w-6 h-6 animate-bounce" />
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight font-headline">בהצלחה במבחני הלשכה, אהובה! ✨</h2>
              <h3 className="text-2xl md:text-3xl font-bold text-primary tracking-tight italic"> אוהב אותך המון, בעלך!! </h3>
              <p className="text-on-surface-variant font-medium opacity-80 max-w-md mx-auto">כל דקה של למידה מקרבת אותך להצלחה הגדולה שלך. אני כאן איתך בכל רגע.</p>
            </section>

            {/* Tactile Timer Section */}
            <section className="relative flex flex-col items-center justify-center py-12">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-full blur-3xl opacity-30 pointer-events-none"></div>
              <div className="relative z-10 text-center space-y-6">
                {/* Status Indicator */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-outline-variant/15">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor()} ${status !== 'idle' ? 'animate-pulse' : ''}`}></span>
                  <span className="text-sm font-semibold tracking-wide text-primary">{getStatusText()}</span>
                </div>
                {/* Digital Stopwatch */}
                <div className="font-headline text-7xl md:text-9xl font-extrabold tracking-tighter tabular-nums text-on-surface drop-shadow-2xl">
                  {formatTime(seconds)}
                </div>
                {/* Active Subject Badge */}
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

            {/* Controls Group */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl transition-all duration-300 active:scale-[0.98] ${status === 'learning' ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high hover:bg-primary-container text-on-surface'}`}
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
                className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl transition-all duration-300 active:scale-[0.98] ${status === 'break' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high hover:bg-secondary-container text-on-surface'}`}
              >
                <CoffeeIcon className="w-8 h-8" />
                <span className="font-bold">הפסקה</span>
              </button>

              <button 
                onClick={handleStartPersonal}
                className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl transition-all duration-300 active:scale-[0.98] ${status === 'personal' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container-high hover:bg-tertiary-container/30 text-on-surface'}`}
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

            {/* Daily Summary Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-on-surface">סיכום יומי</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={undo}
                    disabled={history.length === 0}
                    className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors border border-outline-variant/15"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={redo}
                    disabled={redoStack.length === 0}
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
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-on-surface-variant opacity-50 italic">
                    אין נתונים להצגה להיום. התחל ללמוד!
                  </div>
                )}
                {sessions.map((session) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={session.id} 
                    className="flex items-center justify-between p-5 bg-surface-container-low rounded-xl relative overflow-hidden group"
                  >
                    <div className={`absolute right-0 top-0 bottom-0 w-1 ${
                      session.type === 'learning' ? 'bg-primary' : 
                      session.type === 'break' ? 'bg-secondary' : 
                      'bg-tertiary-fixed'
                    }`}></div>
                    <div className="flex flex-col">
                      <span className="text-on-surface font-bold">
                        {session.type === 'learning' ? session.subject : session.type === 'break' ? 'הפסקה' : 'אישי'}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {session.type === 'learning' ? 'למידה פעילה' : session.type === 'break' ? 'מנוחה והתרעננות' : 'סידורים וזמן פרטי'}
                      </span>
                    </div>
                    <div className={`text-lg font-headline font-bold ${
                      session.type === 'learning' ? 'text-primary' : 
                      session.type === 'break' ? 'text-secondary' : 
                      'text-tertiary-fixed'
                    }`}>
                      {formatTime(session.duration)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Inspirational Quote Card */}
            <section className="p-10 rounded-[2.5rem] bg-gradient-to-br from-primary-container to-surface border border-primary/20 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Flower2 className="w-24 h-24" />
              </div>
              <Quote className="text-primary w-12 h-12 mx-auto opacity-40" />
              <p className="text-xl md:text-2xl font-bold italic text-on-surface leading-relaxed font-headline">
                "את חזקה, את חכמה, ואת הולכת לעבור את זה בגדול. כל מאמץ קטן היום הוא הניצחון של מחר."
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="h-[2px] w-8 bg-primary/30 rounded-full"></div>
                <Heart className="w-4 h-4 text-primary fill-primary" />
                <div className="h-[2px] w-8 bg-primary/30 rounded-full"></div>
              </div>
            </section>
          </div>
        ) : (
          <StatsView />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-primary/10 px-6 py-4 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button 
            onClick={() => setView('timer')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'timer' ? 'text-primary scale-110' : 'text-on-surface-variant opacity-60'}`}
          >
            <Timer className="w-6 h-6" />
            <span className="text-[10px] font-bold">טיימר</span>
          </button>
          <button 
            onClick={() => setView('stats')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'stats' ? 'text-primary scale-110' : 'text-on-surface-variant opacity-60'}`}
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
                    <h2 className="text-2xl font-bold text-on-surface font-headline italic">הגדרות אישיות</h2>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-primary-container rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-on-surface-variant" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-2xl">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface">מצב ספירה לאחור</span>
                      <span className="text-xs text-on-surface-variant">החלף בין שעון עצר לטיימר</span>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, isCountdownMode: !prev.isCountdownMode, isPomodoroMode: false }))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.isCountdownMode ? 'bg-primary' : 'bg-outline'}`}
                    >
                      <motion.div 
                        animate={{ x: settings.isCountdownMode ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>

                  {/* Pomodoro Toggle */}
                  <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-2xl">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface">מצב פומודורו</span>
                      <span className="text-xs text-on-surface-variant">25 דקות עבודה, 5 דקות הפסקה</span>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, isPomodoroMode: !prev.isPomodoroMode, isCountdownMode: false }))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.isPomodoroMode ? 'bg-primary' : 'bg-outline'}`}
                    >
                      <motion.div 
                        animate={{ x: settings.isPomodoroMode ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>

                  {/* Durations */}
                  {!settings.isPomodoroMode && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant pr-2">למידה</label>
                        <input 
                          type="number" 
                          value={settings.learningDuration}
                          onChange={(e) => setSettings(prev => ({ ...prev, learningDuration: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-surface-container-high border-none rounded-xl p-3 text-center font-bold focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant pr-2">הפסקה</label>
                        <input 
                          type="number" 
                          value={settings.breakDuration}
                          onChange={(e) => setSettings(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-surface-container-high border-none rounded-xl p-3 text-center font-bold focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant pr-2">אישי</label>
                        <input 
                          type="number" 
                          value={settings.personalDuration}
                          onChange={(e) => setSettings(prev => ({ ...prev, personalDuration: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-surface-container-high border-none rounded-xl p-3 text-center font-bold focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}

                  {settings.isPomodoroMode && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant pr-2">עבודה (דק')</label>
                        <input 
                          type="number" 
                          value={settings.pomodoroWork}
                          onChange={(e) => setSettings(prev => ({ ...prev, pomodoroWork: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-surface-container-high border-none rounded-xl p-3 text-center font-bold focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface-variant pr-2">הפסקה (דק')</label>
                        <input 
                          type="number" 
                          value={settings.pomodoroBreak}
                          onChange={(e) => setSettings(prev => ({ ...prev, pomodoroBreak: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-surface-container-high border-none rounded-xl p-3 text-center font-bold focus:ring-2 focus:ring-primary"
                        />
                      </div>
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

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-3 bg-white/80 backdrop-blur-2xl border-t border-primary/10 shadow-[0_-10px_30px_rgba(232,160,191,0.15)] md:hidden">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex flex-col items-center justify-center rounded-2xl px-4 py-2 text-[12px] font-bold transition-all active:scale-90 ${status === 'learning' ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant'}`}
        >
          <BookOpen className="w-6 h-6" />
          <span>למידה</span>
        </button>
        <button 
          onClick={handleStartBreak}
          className={`flex flex-col items-center justify-center rounded-2xl px-4 py-2 text-[12px] font-bold transition-all active:scale-90 ${status === 'break' ? 'bg-secondary-container text-on-secondary' : 'text-on-surface-variant'}`}
        >
          <CoffeeIcon className="w-6 h-6" />
          <span>הפסקה</span>
        </button>
        <button 
          onClick={handleStartPersonal}
          className={`flex flex-col items-center justify-center rounded-2xl px-4 py-2 text-[12px] font-bold transition-all active:scale-90 ${status === 'personal' ? 'bg-tertiary-container/30 text-on-surface' : 'text-on-surface-variant'}`}
        >
          <Footprints className="w-6 h-6" />
          <span>אישי</span>
        </button>
        <button 
          onClick={handleStop}
          className="flex flex-col items-center justify-center text-on-surface-variant/60 px-4 py-2 text-[12px] font-bold hover:text-on-surface transition-colors"
        >
          <StopIcon className="w-6 h-6" />
          <span>סיום</span>
        </button>
      </nav>
    </div>
  );
}
