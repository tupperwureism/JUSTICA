import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Moon, Sun, Scale } from 'lucide-react';

interface NavbarGatewayProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

/**
 * NavbarGateway — Topbar sticky JUSTICA
 * Rule #2: All action buttons locked with whitespace-nowrap + flex-shrink-0 + min-height via .navbar-btn-action
 * Rule #4: w-full max-w-[1600px] mx-auto layout engine
 */
export const NavbarGateway: React.FC<NavbarGatewayProps> = ({
  isDark,
  onToggleTheme,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnVerifier = location.pathname === '/public/verify';

  return (
    <header className="gateway-navbar-shell">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 md:px-14 flex items-center justify-between gap-4">
        {/* ── Brand Logo ── */}
        <Link
          to="/"
          className="navbar-brand-pill cursor-pointer group transition-transform hover:scale-[1.01]"
          aria-label="Kembali ke Beranda JUSTICA"
        >
          <div className="flex items-center gap-2.5">
            <Scale className="w-7 h-7 text-primary drop-shadow-[0_0_10px_rgba(212,175,55,0.4)] transition-transform group-hover:rotate-12" strokeWidth={2.5} />
            <span className="font-heading font-black text-xl sm:text-2xl tracking-tight text-foreground drop-shadow-sm">
              JUSTICA
            </span>
          </div>
          <span className="hidden lg:inline-flex items-center text-xs sm:text-sm font-semibold text-muted-foreground border-l-2 border-border pl-3.5 tracking-wide">
            Platform Konsultasi &amp; Layanan Hukum Profesional
          </span>
        </Link>

        {/* ── Action Buttons ── */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="navbar-btn-action bg-secondary hover:bg-secondary/80 text-foreground border border-border shadow-sm cursor-pointer transition-colors"
            aria-label={isDark ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
          >
            {isDark
              ? <Moon className="w-4 h-4 shrink-0 text-blue-400" />
              : <Sun className="w-4 h-4 shrink-0 text-amber-500" />
            }
            <span className="hidden sm:inline">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          {/* Verifikasi CTA  ↔  Kembali toggle */}
          {isOnVerifier ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="navbar-btn-action bg-secondary hover:bg-secondary/80 text-foreground border border-border shadow-sm cursor-pointer transition-colors"
            >
              <span className="text-sm font-bold">&larr;</span>
              <span>Kembali ke Beranda</span>
            </button>
          ) : (
            <Link
              to="/public/verify"
              className="navbar-btn-action bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400 font-extrabold shadow-[0_4px_20px_rgba(245,158,11,0.35)] border-0 cursor-pointer transition-all hover:scale-[1.02]"
              id="nav-btn-verifikasi"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Verifikasi Dokumen SHA-256</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
