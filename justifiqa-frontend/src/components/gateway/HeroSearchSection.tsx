import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, ShieldCheck, Scale, FileText, Hash } from 'lucide-react';

interface HeroSearchSectionProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onChipClick: (topic: string) => void;
  isDark?: boolean;
}

const POPULAR_CHIPS = [
  { label: 'Somasi Terbuka', topic: 'somasi', icon: ShieldCheck },
  { label: 'Gugatan Sederhana', topic: 'gugatan', icon: Scale },
  { label: 'Perjanjian Damai', topic: 'perjanjian', icon: FileText },
  { label: 'Verifikasi Hash SHA-256', topic: 'verifikasi', icon: Hash },
];

export const HeroSearchSection: React.FC<HeroSearchSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onChipClick,
}) => {
  return (
    <section className="hero-section-container animate-fade-in">
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-5 max-w-[920px] mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] font-heading text-foreground">
          Akses Keadilan &amp;{' '}
          <span className="text-gradient-gold drop-shadow-sm">
            Praktik Hukum Digital Tanpa Batas
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl max-w-[800px] mx-auto font-normal leading-relaxed text-muted">
          Satu gerbang terpadu untuk verifikasi integritas berkas digital (SHA-256),
          konsultasi advokat berlisensi PERADI, dan transaksi escrow aman tersertifikasi.
        </p>
      </div>

      {/* Hero Search Box (Glowing Obsidian Glass Container) */}
      <form
        onSubmit={onSearchSubmit}
        className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 p-3 rounded-3xl border border-border bg-card backdrop-blur-2xl shadow-[var(--shadow-glass)] transition-all focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20"
      >
        <div className="relative flex-1 w-full flex items-center">
          <div className="pl-4 pr-3 text-muted flex items-center justify-center">
            <Search className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari layanan hukum, advokat spesialis, atau verifikasi berkas..."
            className="w-full h-14 border-none bg-transparent shadow-none px-2 text-base sm:text-lg text-foreground placeholder:text-muted focus-visible:ring-0 font-medium"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto h-14 px-10 font-extrabold text-sm sm:text-base gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all shrink-0"
        >
          <span>CARI ADVOKAT</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </form>

      {/* Layanan Populer Chips Container */}
      <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto pt-2">
        <span className="text-xs sm:text-sm text-muted font-extrabold uppercase tracking-widest mr-2 flex items-center shrink-0">
          ⚡ LAYANAN POPULER:
        </span>
        {POPULAR_CHIPS.map((chip) => {
          const IconComp = chip.icon;
          return (
            <button
              key={chip.topic}
              type="button"
              onClick={() => onChipClick(chip.topic)}
              className="chip-service-item group"
            >
              <IconComp className="w-4 h-4 text-primary group-hover:scale-110 transition-transform shrink-0" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
