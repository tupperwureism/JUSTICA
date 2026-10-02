import React from 'react';
import { TierSelectorCard } from './TierSelectorCard';
import { MockConsultationService } from '../services/mockConsultationService';
import type { ConsultationTier } from '../types/consultation';
import { Scale, Lock, Database } from 'lucide-react';

export interface ConsultationSectionProps {
  onSelectTier: (tier: ConsultationTier) => void;
}

export const ConsultationSection: React.FC<ConsultationSectionProps> = ({ onSelectTier }) => {
  const tiers = MockConsultationService.getTiers();

  return (
    <section className="space-y-8 animate-fade-in py-4">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <Scale className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Proses Inti 1 &middot; Pemilihan Tier Layanan</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          Pilih Tingkat Pendampingan <span className="text-amber-600 dark:text-amber-400">Hukum Anda</span>
        </h2>

        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          Mulai dari diagnosa AI instan hingga pendampingan advokat terverifikasi PERADI. 
          Seluruh dana konsultasi berbayar dilindungi oleh penguncian dompet digital{' '}
          <span className="text-amber-600 dark:text-amber-400 font-semibold">ACID Concurrency Row-Lock</span>.
        </p>

        {/* Security Info Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5 text-foreground">
            <Lock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
            <span>Dana ditahan di Escrow Mutex hingga sesi selesai</span>
          </span>
          <span className="flex items-center gap-1.5 text-foreground">
            <Database className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <span>Jejak audit dicatat di WORM Immutable Vault</span>
          </span>
        </div>
      </div>

      {/* 3-Tier Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-stretch">
        {tiers.map((tier) => (
          <TierSelectorCard
            key={tier.id}
            tier={tier}
            onSelect={onSelectTier}
            isSelected={tier.id === 'TIER_2_ADVOCATE'}
          />
        ))}
      </div>
    </section>
  );
};
