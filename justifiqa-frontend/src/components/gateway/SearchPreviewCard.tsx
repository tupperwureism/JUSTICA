import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AdvocateQuickProfile } from './AdvocateQuickProfile';

interface SearchPreviewCardProps {
  searchQuery: string;
  onClose: () => void;
}

/**
 * SearchPreviewCard — Modal Overlay terpusat sempurna (CL-02)
 * Fix Sub-Batch 1.1: Diubah dari in-flow ke `fixed inset-0 z-50` overlay
 * agar selalu berada di tengah layar tanpa dipengaruhi lebar container parent.
 * Rule #2: Tombol Tutup Preview → whitespace-nowrap, flex-shrink-0, min-height via shrink-0+flex.
 */
export const SearchPreviewCard: React.FC<SearchPreviewCardProps> = ({
  searchQuery,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    /* ── FIXED OVERLAY BACKDROP ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}          /* click backdrop → close */
      role="dialog"
      aria-modal="true"
      aria-label="Hasil Pencarian Cepat Advokat"
    >
      {/* ── MODAL CARD (stop propagation → clicking card tidak tutup modal) ── */}
      <div
        className="preview-card-gateway w-full max-w-3xl mx-auto shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Accent Stripe */}
        <div className="absolute left-0 right-0 top-0 h-[5px] bg-gradient-to-r from-amber-500 via-yellow-400 to-blue-500 z-30 pointer-events-none rounded-t-3xl" />

        {/* Inner Safe-Zone (Pakai preview-card-safe-wrapper dari index.css) */}
        <div className="preview-card-safe-wrapper">
          {/* ── Header Bar ── */}
          <div className="flex items-center justify-between pb-5 border-b border-border transition-colors">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)] shrink-0" />
              <span className="font-extrabold text-sm sm:text-base text-amber-400 font-heading tracking-tight drop-shadow-sm">
                ⚡ HASIL PENCARIAN CEPAT ADVOKAT TERVERIFIKASI (CL-02)
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground cursor-pointer font-bold px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition-all shadow-sm shrink-0 whitespace-nowrap"
              id="btn-tutup-preview"
              aria-label="Tutup preview hasil pencarian"
            >
              <X className="w-4 h-4 shrink-0" />
              <span>Tutup Preview</span>
            </button>
          </div>

          {/* ── Advocate Profiles ── */}
          <div className="pt-2">
            <AdvocateQuickProfile searchQuery={searchQuery} />
          </div>
        </div>
      </div>
    </div>
  );
};
