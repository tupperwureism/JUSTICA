import React from 'react';
import { ShieldCheck, Lock, KeyRound } from 'lucide-react';

interface TrustBarSectionProps {
  isDark?: boolean;
}

export const TrustBarSection: React.FC<TrustBarSectionProps> = () => {
  const TRUST_ITEMS = [
    {
      icon: ShieldCheck,
      text: 'Advokat Berlisensi Resmi (SIPP MA Terverifikasi)',
      color: 'text-blue-400',
    },
    {
      icon: Lock,
      text: 'Rekening Bersama (Escrow ACID) Aman Terjamin',
      color: 'text-amber-400',
    },
    {
      icon: KeyRound,
      text: 'Kerahasiaan Sesi Terjamin (Zero-Knowledge E2EE)',
      color: 'text-emerald-400',
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto pb-12 pt-4 px-4 sm:px-6">
      <div className="w-full rounded-2xl border border-border bg-card backdrop-blur-xl shadow-xl trust-bar-safe-wrapper transition-colors">
        {TRUST_ITEMS.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3.5 font-bold text-xs sm:text-sm md:text-base text-foreground shrink-0 transition-colors"
            >
              <div className={`p-2.5 rounded-xl bg-secondary border border-border transition-colors ${item.color}`}>
                <IconComp className="w-5 h-5 shrink-0" />
              </div>
              <span>{item.text}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
