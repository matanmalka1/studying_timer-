import { Heart, Flower2, Quote } from 'lucide-react';

export function WelcomeHero() {
  return (
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
  );
}

export function MotivationalQuote() {
  return (
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
  );
}
