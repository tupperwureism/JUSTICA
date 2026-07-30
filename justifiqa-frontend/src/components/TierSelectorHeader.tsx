import { Lock, Sparkles } from 'lucide-react';
import type { ConsultationTier } from '../types/consultation';

interface TierSelectorHeaderProps { tier: ConsultationTier; isGold: boolean; isRed: boolean }

export function TierSelectorHeader({ tier, isGold, isRed }: TierSelectorHeaderProps) {
  const badgeClass = isGold ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40' : isRed ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40';
  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${badgeClass}`}>{tier.badgeText}</span>
        {tier.isEscrowRequired ? <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-500/15 px-2.5 py-1 rounded-md border border-amber-500/30"><Lock className="w-3.5 h-3.5" />Escrow Mutex Required</span> : <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-500/15 px-2.5 py-1 rounded-md border border-blue-500/30"><Sparkles className="w-3.5 h-3.5" />Direct Instant Access</span>}
      </div>
      <div>
        <h3 className="text-xl font-extrabold text-foreground tracking-tight">{tier.title}</h3>
        <div className="mt-2 flex items-baseline gap-1"><span className={`text-2xl md:text-3xl font-extrabold ${isGold ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>{tier.priceLabel}</span></div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed font-medium">{tier.description}</p>
      </div>
    </>
  );
}
