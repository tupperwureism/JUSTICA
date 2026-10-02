import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, Star, Briefcase, Clock, CheckCircle2, ArrowRight, MapPin } from 'lucide-react';

interface AdvocateQuickProfileProps {
  searchQuery: string;
}

export const AdvocateQuickProfile: React.FC<AdvocateQuickProfileProps> = ({ searchQuery }) => {
  const navigate = useNavigate();
  const queryLabel = searchQuery.trim() || 'Hukum Perdata & Bisnis';

  return (
    <div className="flex flex-col gap-8 pb-3">
      {/* Top Status & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner p-3.5">
            <Scale className="w-7 h-7" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-extrabold px-4 py-1.5 text-xs gap-2 rounded-full shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </Badge>
            <Badge variant="outline" className="border-amber-500/40 text-amber-300 font-extrabold px-4 py-1.5 text-xs rounded-full bg-amber-500/10 shadow-sm">
              SIPP TERVERIFIKASI
            </Badge>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
          ID: ADV-8891-JKT
        </span>
      </div>

      {/* Advocate Name & Location */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground font-heading drop-shadow-sm transition-colors">
          Dr. Aryo Wibisono, S.H., M.H.
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground font-medium flex items-center gap-2 transition-colors">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Jakarta Pusat • Spesialis {queryLabel}</span>
        </p>
      </div>

      {/* Stats Section (Spacious pure typography without borders/boxes) */}
      <div className="grid grid-cols-3 divide-x divide-border py-6 my-1 border-y border-border transition-colors">
        <div className="preview-stat-box">
          <div className="flex items-center gap-2 text-amber-400 font-black text-xl sm:text-2xl">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>4.97</span>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">RATING</span>
        </div>
        <div className="preview-stat-box">
          <div className="flex items-center gap-2 text-foreground font-black text-xl sm:text-2xl transition-colors">
            <Briefcase className="w-5 h-5 text-blue-400" />
            <span>312</span>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">KASUS</span>
        </div>
        <div className="preview-stat-box">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-xl sm:text-2xl">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span>&lt; 2 Jam</span>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">RESPON</span>
        </div>
      </div>

      {/* Specialization Tags */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {['Somasi Terbuka', 'Gugatan Perdata', 'Perjanjian Bisnis', 'Mediasi Sengketa'].map((tag) => (
          <span key={tag} className="preview-chip-pill px-4 py-2 text-xs">
            {tag}
          </span>
        ))}
      </div>

      {/* Price Highlight Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/25 text-foreground shadow-sm my-1">
        <div className="flex items-center gap-3.5">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-sm sm:text-base font-bold text-foreground transition-colors">Konsultasi pertama terenkripsi E2EE</span>
        </div>
        <span className="text-base sm:text-lg font-black text-amber-400 font-heading">
          Gratis <span className="text-xs font-bold text-slate-400">/ 30 mnt</span>
        </span>
      </div>

      {/* Action CTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/client/auth?redirect=${encodeURIComponent(`/client/dashboard?q=${encodeURIComponent(searchQuery)}`)}`)}
          className="w-full h-14 rounded-2xl font-bold text-base border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all shadow-sm cursor-pointer"
        >
          Lihat Profil Lengkap
        </Button>
        <Button
          variant="default"
          onClick={() => navigate(`/client/auth?redirect=${encodeURIComponent(`/client/dashboard?q=${encodeURIComponent(searchQuery)}`)}`)}
          className="w-full h-14 rounded-2xl font-black text-base bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Konsultasi Sekarang</span>
          <ArrowRight className="w-5 h-5 shrink-0" />
        </Button>
      </div>
    </div>
  );
};
