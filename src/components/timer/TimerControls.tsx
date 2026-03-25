import { useState } from "react";
import {
  Coffee as CoffeeIcon,
  Footprints,
  StopCircle as StopIcon,
} from "lucide-react";
import type { Status } from "../../types";
import { SubjectDropdown } from "./SubjectDropdown";

interface Props {
  status: Status;
  onStartLearning: (subject: string) => void;
  onStartBreak: () => void;
  onStartPersonal: () => void;
  onStop: () => void;
}

export function TimerControls({
  status,
  onStartLearning,
  onStartBreak,
  onStartPersonal,
  onStop,
}: Props) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SubjectDropdown
        isOpen={showDropdown}
        isActive={status === "learning"}
        onToggle={() => setShowDropdown((v) => !v)}
        onSelect={(subject) => {
          onStartLearning(subject);
          setShowDropdown(false);
        }}
      />

      <button
        onClick={onStartBreak}
        className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl transition-all duration-300 active:scale-[0.98] ${
          status === "break"
            ? "bg-secondary-container text-on-secondary-container"
            : "bg-surface-container-high hover:bg-secondary-container text-on-surface"
        }`}
      >
        <CoffeeIcon className="w-8 h-8" />
        <span className="font-bold">הפסקה</span>
      </button>

      <button
        onClick={onStartPersonal}
        className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl transition-all duration-300 active:scale-[0.98] ${
          status === "personal"
            ? "bg-tertiary-container text-on-tertiary-container"
            : "bg-surface-container-high hover:bg-tertiary-container/30 text-on-surface"
        }`}
      >
        <Footprints className="w-8 h-8" />
        <span className="font-bold">אישי</span>
      </button>

      <button
        onClick={onStop}
        className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl bg-surface-container-high hover:bg-error-container/40 text-on-surface transition-all duration-300 active:scale-[0.98]"
      >
        <StopIcon className="w-8 h-8" />
        <span className="font-bold">סיום יום</span>
      </button>
    </section>
  );
}
