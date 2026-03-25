import { motion } from 'motion/react';

interface Props {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: Props) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-2xl">
      <div className="flex flex-col">
        <span className="font-bold text-on-surface">{label}</span>
        {description && (
          <span className="text-xs text-on-surface-variant">{description}</span>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          checked ? 'bg-primary' : 'bg-outline'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 24 : 4 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}
