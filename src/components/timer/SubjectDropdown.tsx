import { BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SUBJECTS } from "../../constants";

interface Props {
  isOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
  onSelect: (subject: string) => void;
}

export function SubjectDropdown({
  isOpen,
  isActive,
  onToggle,
  onSelect,
}: Props) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl transition-all duration-300 active:scale-[0.98] ${
          isActive
            ? "bg-primary-container text-on-primary"
            : "bg-surface-container-high hover:bg-primary-container text-on-surface"
        }`}
      >
        <BookOpen className="w-8 h-8" />
        <span className="font-bold">למידה</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full glass rounded-xl border border-outline-variant/15 shadow-2xl z-40 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto no-scrollbar p-2 space-y-1">
              {SUBJECTS.map((subject) => (
                <button
                  key={subject}
                  className="w-full text-right px-4 py-2.5 rounded-lg hover:bg-primary/20 text-sm transition-colors"
                  onClick={() => onSelect(subject)}
                >
                  {subject}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
