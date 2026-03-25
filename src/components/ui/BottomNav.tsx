import { Timer, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import type { View } from '../../types';

interface Props {
  view: View;
  onChangeView: (view: View) => void;
  onOpenSettings: () => void;
}

export function BottomNav({ view, onChangeView, onOpenSettings }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-primary/10 px-6 py-4 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center">
        <NavButton
          icon={<Timer className="w-6 h-6" />}
          label="טיימר"
          isActive={view === 'timer'}
          onClick={() => onChangeView('timer')}
        />
        <NavButton
          icon={<BarChart2 className="w-6 h-6" />}
          label="סטטיסטיקה"
          isActive={view === 'stats'}
          onClick={() => onChangeView('stats')}
        />
        <NavButton
          icon={<SettingsIcon className="w-6 h-6" />}
          label="הגדרות"
          isActive={false}
          onClick={onOpenSettings}
        />
      </div>
    </nav>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${
        isActive ? 'text-primary scale-110' : 'text-on-surface-variant opacity-60 hover:opacity-100'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
