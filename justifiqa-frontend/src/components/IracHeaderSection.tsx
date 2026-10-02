import React from 'react';
import { Sparkles } from 'lucide-react';

export const IracHeaderSection: React.FC = () => {
  return (
    <div className="text-center max-w-3xl mx-auto space-y-3">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Proses Inti 2 &middot; Bedah Kronologi &amp; Generator IRAC</span>
      </div>

      <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
        Bedah Fakta ke Format <span className="text-amber-600 dark:text-amber-400">IRAC Presisi AI</span>
      </h2>

      <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
        Tuliskan cerita kronologi hukum Anda atau pilih prasetel sengketa di bawah. 
        Mesin AI Justica akan membedah secara yuridis menjadi rumusan{' '}
        <strong className="text-foreground">Issue, Rule, Application, dan Conclusion</strong>.
      </p>
    </div>
  );
};
