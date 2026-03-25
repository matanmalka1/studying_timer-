import { motion } from 'motion/react';
import { Download as DownloadIcon, Undo2, Redo2, BookMarked, PenLine } from 'lucide-react';
import type { Session } from '../../types';
import { formatTime, formatTimeShort } from '../../utils';

interface Props {
  sessions: Session[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function SessionList({ sessions, canUndo, canRedo, onUndo, onRedo }: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-on-surface">סיכום יומי</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors border border-outline-variant/15"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
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
          <SessionItem key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}

function SessionItem({ session }: { session: Session }) {
  const accentClass =
    session.type === 'learning'
      ? 'bg-primary'
      : session.type === 'break'
      ? 'bg-secondary'
      : 'bg-tertiary-fixed';

  const textClass =
    session.type === 'learning'
      ? 'text-primary'
      : session.type === 'break'
      ? 'text-secondary'
      : 'text-tertiary-fixed';

  const label =
    session.type === 'learning'
      ? session.subject
      : session.type === 'break'
      ? 'הפסקה'
      : 'אישי';

  const sublabel =
    session.type === 'learning'
      ? 'למידה פעילה'
      : session.type === 'break'
      ? 'מנוחה והתרעננות'
      : 'סידורים וזמן פרטי';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-5 bg-surface-container-low rounded-xl relative overflow-hidden"
    >
      <div className={`absolute right-0 top-0 bottom-0 w-1 ${accentClass}`} />
      <div className="flex flex-col gap-0.5">
        <span className="text-on-surface font-bold">{label}</span>
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
        <span className="text-xs text-on-surface-variant opacity-60">{sublabel}</span>
      </div>
      <div className={`text-lg font-headline font-bold ${textClass}`}>
        {formatTime(session.duration)}
      </div>
    </motion.div>
  );
}
