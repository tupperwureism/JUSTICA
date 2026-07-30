import React from 'react';
import { CheckCircle2, ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { ConsultationTier } from '../types/consultation';
import { TierSelectorHeader } from './TierSelectorHeader';

interface TierSelectorCardProps {
  tier: ConsultationTier;
  isSelected?: boolean;
  onSelect: (tier: ConsultationTier) => void;
}

export const TierSelectorCard: React.FC<TierSelectorCardProps> = ({
  tier,
  isSelected = false,
  onSelect,
}) => {
  const isGold = tier.highlightColor === 'gold';
  const isRed = tier.highlightColor === 'red';

  const cardStyle = isGold
    ? 'border-amber-500/60 bg-gradient-to-b from-card to-amber-950/20 shadow-xl'
    : isRed
    ? 'border-rose-500/60 bg-gradient-to-b from-card to-rose-950/20 hover:border-rose-500 shadow-xl'
    : 'border-blue-500/40 bg-gradient-to-b from-card to-blue-950/20 shadow-xl';

  return (
    <div
      className={`flex flex-col justify-between h-full relative transition-all duration-300 p-6 rounded-2xl border ${cardStyle} ${
        isSelected ? 'ring-2 ring-amber-400 shadow-[0_0_35px_rgba(212,175,55,0.4)]' : ''
      }`}
    >
      <div className="space-y-4">
        <TierSelectorHeader tier={tier} isGold={isGold} isRed={isRed} />

        <div className="pt-4 border-t border-border space-y-2.5">
          <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-extrabold">
            Spesifikasi Layanan:
          </p>
          <ul className="space-y-2">
            {tier.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground font-medium leading-snug">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isGold ? 'text-amber-500 dark:text-amber-400' : 'text-blue-500 dark:text-blue-400'}`} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border space-y-4">
        <div className="bg-secondary/60 rounded-xl p-3.5 border border-border text-xs text-muted-foreground flex items-start gap-2.5">
          {isRed ? (
            <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-extrabold text-foreground">Rekomendasi: </span>
            <span className="font-medium text-foreground">{tier.recommendedFor}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(tier)}
          className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap flex-shrink-0 ${
            isGold
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-amber-500/20'
              : isRed
              ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-rose-500/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          <span>Pilih {tier.id === 'TIER_1_AI' ? 'Navigasi AI' : 'Jadwal & Bayar Escrow'}</span>
          <ArrowRight className="w-4 h-4 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
};
