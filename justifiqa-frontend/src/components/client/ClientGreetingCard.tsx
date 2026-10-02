// src/components/client/ClientGreetingCard.tsx
import React from 'react';
import { Sparkles, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientGreetingCardProps {
  clientName: string;
  onStartCatalogSearch: () => void;
  onStartProBono: () => void;
}

export const ClientGreetingCard: React.FC<ClientGreetingCardProps> = ({
  clientName,
  onStartCatalogSearch,
  onStartProBono,
}) => {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-border shadow-glass bg-gradient-to-br from-primary/15 via-card to-amber-500/10">
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-72 h-72 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Dasbor Klien
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading tracking-tight">
            Halo, {clientName}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kelola sesi konsultasi aktif, unduh dokumen hukum Anda, atau jadwalkan konsultasi baru dengan advokat mitra terverifikasi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-shrink-0">
          <Button
            type="button"
            size="lg"
            onClick={onStartCatalogSearch}
            className="client-primary-action"
          >
            <ArrowRight className="w-4 h-4" />
            <span>+ KONSULTASI BARU</span>
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={onStartProBono}
            className="h-12 px-6 rounded-xl font-bold text-sm gap-2 whitespace-nowrap flex-shrink-0 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
          >
            <Heart className="w-4 h-4" />
            <span>Layanan Pro Bono Gratis</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
