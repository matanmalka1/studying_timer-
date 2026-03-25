import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Heart } from 'lucide-react';
import type { AppSettings } from '../../types';
import { Toggle } from '../ui/Toggle';
import { NumberInput } from '../ui/NumberInput';

interface Props {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onChangeSettings: (settings: AppSettings) => void;
}

export function SettingsModal({ isOpen, settings, onClose, onChangeSettings }: Props) {
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onChangeSettings({ ...settings, [key]: value });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-surface-container-low rounded-3xl border border-outline-variant/15 shadow-2xl overflow-hidden"
          >
            <div className="p-6 space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-6 h-6 text-primary fill-primary" />
                  <h2 className="text-2xl font-bold text-on-surface font-headline italic">
                    הגדרות אישיות
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-primary-container rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-on-surface-variant" />
                </button>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <Toggle
                  checked={settings.isCountdownMode}
                  onChange={val =>
                    onChangeSettings({ ...settings, isCountdownMode: val, isPomodoroMode: false })
                  }
                  label="מצב ספירה לאחור"
                  description="החלף בין שעון עצר לטיימר"
                />
                <Toggle
                  checked={settings.isPomodoroMode}
                  onChange={val =>
                    onChangeSettings({ ...settings, isPomodoroMode: val, isCountdownMode: false })
                  }
                  label="מצב פומודורו"
                  description="25 דקות עבודה, 5 דקות הפסקה"
                />
              </div>

              {/* Duration inputs */}
              {!settings.isPomodoroMode && (
                <div className="grid grid-cols-3 gap-4">
                  <NumberInput
                    label="למידה"
                    value={settings.learningDuration}
                    onChange={v => update('learningDuration', v)}
                  />
                  <NumberInput
                    label="הפסקה"
                    value={settings.breakDuration}
                    onChange={v => update('breakDuration', v)}
                  />
                  <NumberInput
                    label="אישי"
                    value={settings.personalDuration}
                    onChange={v => update('personalDuration', v)}
                  />
                </div>
              )}

              {settings.isPomodoroMode && (
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput
                    label="עבודה (דק')"
                    value={settings.pomodoroWork}
                    onChange={v => update('pomodoroWork', v)}
                  />
                  <NumberInput
                    label="הפסקה (דק')"
                    value={settings.pomodoroBreak}
                    onChange={v => update('pomodoroBreak', v)}
                  />
                </div>
              )}

              {/* Save */}
              <button
                onClick={onClose}
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
  );
}
