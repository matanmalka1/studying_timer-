/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import type { View } from './types';
import { useTimer, useSessionHistory, useSettings } from './hooks';
import { TimerView } from './components/timer';
import { StatsView } from './components/stats';
import { SettingsModal } from './components/setting/SettingsModal';
import { AppHeader, BottomNav } from './components/ui';

export default function App() {
  const [view, setView] = useState<View>('timer');
  const [showSettings, setShowSettings] = useState(false);

  const { settings, setSettings } = useSettings();
  const { sessions, addSession, undo, redo, canUndo, canRedo } = useSessionHistory();

  const {
    status,
    seconds,
    learningPhase,
    readingSeconds,
    answeringSeconds,
    activeSubject,
    startSession,
    handleStop,
    handleSwitchToAnswering,
  } = useTimer(settings, addSession);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden font-sans" dir="rtl">
      <AppHeader onOpenSettings={() => setShowSettings(true)} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 md:py-16 relative">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-40 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

        {view === 'timer' ? (
          <TimerView
            status={status}
            seconds={seconds}
            learningPhase={learningPhase}
            readingSeconds={readingSeconds}
            answeringSeconds={answeringSeconds}
            activeSubject={activeSubject}
            sessions={sessions}
            canUndo={canUndo}
            canRedo={canRedo}
            onStartLearning={subject => startSession('learning', subject)}
            onStartBreak={() => startSession('break')}
            onStartPersonal={() => startSession('personal')}
            onStop={handleStop}
            onSwitchToAnswering={handleSwitchToAnswering}
            onUndo={undo}
            onRedo={redo}
          />
        ) : (
          <StatsView sessions={sessions} />
        )}
      </main>

      <BottomNav
        view={view}
        onChangeView={setView}
        onOpenSettings={() => setShowSettings(true)}
      />

      <SettingsModal
        isOpen={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onChangeSettings={setSettings}
      />
    </div>
  );
}