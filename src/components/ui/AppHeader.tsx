import { Settings as SettingsIcon, LibraryBig, Sparkles } from 'lucide-react';

interface Props {
  onOpenSettings: () => void;
}

export function AppHeader({ onOpenSettings }: Props) {
  return (
    <header className="bg-background/80 backdrop-blur-md text-primary font-headline flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto sticky top-0 z-50 border-b border-primary/10">
      <div className="flex items-center gap-4">
        <SettingsIcon
          onClick={onOpenSettings}
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
  );
}
