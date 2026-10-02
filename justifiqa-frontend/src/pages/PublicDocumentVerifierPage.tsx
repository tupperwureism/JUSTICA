import React from 'react';
import { Link } from 'react-router-dom';
import { NavbarGateway } from '../components/gateway/NavbarGateway';
import { PublicVerifierFormCard } from '@/components/verifier/PublicVerifierFormCard';
import { PublicVerifierHero } from '@/components/verifier/PublicVerifierHero';
import { PublicVerifierResult } from '@/components/verifier/PublicVerifierResult';
import { usePublicVerifier } from '@/hooks/usePublicVerifier';

export const PublicDocumentVerifierPage: React.FC = () => {
  const verifier = usePublicVerifier();

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-background text-foreground relative overflow-x-clip">
      {/* Ambient orbs */}
      <div className="absolute top-0 left-1/3 w-[700px] h-[500px] bg-blue-600/8 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-amber-500/6 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* ── NAVBAR ── */}
      <NavbarGateway isDark={verifier.isDark} onToggleTheme={() => verifier.setIsDark(!verifier.isDark)} />

      {/* ── MAIN ── */}
      <main className="flex-1 w-full">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 py-12 sm:py-16 flex flex-col items-center gap-10">

          <PublicVerifierHero />

          <PublicVerifierFormCard {...verifier} />

          {verifier.verifyStatus !== 'idle' && <PublicVerifierResult status={verifier.verifyStatus} verifyHash={verifier.verifyHash} result={verifier.verificationResult} onReset={verifier.reset} />}

          {/* ── BACK LINK ── */}
          <Link
            to="/"
            className="navbar-btn-action bg-secondary hover:bg-secondary/80 text-foreground border border-border shadow-sm cursor-pointer transition-colors"
            id="btn-kembali-beranda"
          >
            &larr; Kembali ke Gerbang Utama
          </Link>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 text-center border-t border-border bg-background text-muted-foreground text-xs font-medium">
        © 2026 JUSTICA Legal Platform &bull; SHA-256 dihitung lokal &bull; Backend hanya mengembalikan metadata publik minimum
      </footer>
    </div>
  );
};
