import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { NavbarGateway } from '../components/gateway/NavbarGateway';
import { HeroSearchSection } from '../components/gateway/HeroSearchSection';
import { PortalCardsGrid } from '../components/gateway/PortalCardsGrid';
import { TrustBarSection } from '../components/gateway/TrustBarSection';
import { SearchPreviewCard } from '../components/gateway/SearchPreviewCard';

/**
 * LandingGatewayPage — Root Gateway (MOCK-J-GATEWAY-01)
 * Orchestrator hanya. Semua section adalah mikro-komponen atomik.
 * Rule #4: max-w-[1600px] layout engine terpusat.
 */
export const LandingGatewayPage: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchPreview, setShowSearchPreview] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDark]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setShowSearchPreview(false);
      return;
    }
    setShowSearchPreview(true);
  };

  const handleChipClick = (topic: string) => {
    if (topic === 'verifikasi') {
      navigate('/public/verify');
      return;
    }
    setSearchQuery(topic);
    setShowSearchPreview(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-background text-foreground selection:bg-blue-500/30 relative overflow-x-clip">
      {/* Background ambient orbs */}
      <div className="absolute top-0 left-1/4 w-[900px] h-[700px] bg-blue-600/8 rounded-full blur-[200px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[700px] h-[500px] bg-amber-500/8 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* ── 1. TOPBAR ── */}
      <NavbarGateway isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />

      {/* ── 2. MAIN CONTENT ── */}
      <main className="flex-1 w-full">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 flex flex-col items-center gap-16 sm:gap-20 pt-10 pb-20 sm:pt-16">
          {/* Section A: Hero + Search */}
          <HeroSearchSection
            isDark={isDark}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (!q.trim()) setShowSearchPreview(false);
            }}
            onSearchSubmit={handleSearchSubmit}
            onChipClick={handleChipClick}
          />

          {/* Section C: Portal Cards */}
          <PortalCardsGrid isDark={isDark} />

          {/* Section D: Trust Bar */}
          <TrustBarSection isDark={isDark} />
        </div>
      </main>

      {/* ── 3. FOOTER ── */}
      <footer className="py-8 px-6 text-center border-t border-border bg-background text-muted-foreground text-xs md:text-sm font-medium">
        © 2026 JUSTICA Legal Platform &bull; Seluruh sesi konsultasi dilindungi kerahasiaan
        hubungan advokat-klien (Attorney-Client Privilege) &amp; WORM Audit Trail.
      </footer>

      {/* ── SEARCH PREVIEW MODAL (Portal → di-render ke document.body, di luar stacking context) ── */}
      {showSearchPreview && createPortal(
        <SearchPreviewCard
          searchQuery={searchQuery}
          onClose={() => setShowSearchPreview(false)}
        />,
        document.body,
      )}
    </div>
  );
};
