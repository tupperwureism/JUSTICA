import React from 'react';
import { PortalCardItem } from './PortalCardItem';
import { User, Award } from 'lucide-react';

interface PortalCardsGridProps {
  isDark?: boolean;
}

export const PortalCardsGrid: React.FC<PortalCardsGridProps> = ({ isDark = true }) => {
  return (
    <section className="w-full max-w-6xl mx-auto flex flex-col items-center">
      {/* Section Header with Balanced Spacing mb-16 sm:mb-20 */}
      <div className="portal-section-header-wrapper">
        <div className="h-px w-20 sm:w-32 bg-gradient-to-r from-transparent via-white/30 to-white/10" />
        <h2 className="text-center font-black text-base md:text-xl uppercase tracking-[0.2em] text-white font-heading">
          PILIH AKSES PORTAL
        </h2>
        <div className="h-px w-20 sm:w-32 bg-gradient-to-l from-transparent via-white/30 to-white/10" />
      </div>

      {/* Grid container with gap-8 and full height cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-stretch">
        {/* CARD 1: KLIEN HUKUM */}
        <PortalCardItem
          isDark={isDark}
          badge="PORTAL PENCARI KEADILAN"
          badgeClass="bg-primary/20 text-primary border-primary/40"
          badgeIcon={User}
          title="KLIEN HUKUM"
          description="Temukan advokat berlisensi, mulai konsultasi hukum daring (E2EE) maupun luring, tangani sengketa, atau ajukan bantuan hukum Pro Bono secara aman dengan perlindungan Escrow."
          features={[
            'Konsultasi terenkripsi Zero-Knowledge E2EE',
            'Perlindungan dana rekening bersama (Mutex Escrow)',
            'Akses kuota bantuan hukum Pro Bono PERADI',
          ]}
          btnText="Masuk / Daftar sebagai Klien"
          btnClass="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black shadow-[0_4px_20px_rgba(212,175,55,0.4)] border-0"
          to="/client/auth"
          topStripeClass="bg-gradient-to-r from-primary via-amber-400 to-yellow-300"
          accentColor="amber"
        />

        {/* CARD 2: MITRA ADVOKAT */}
        <PortalCardItem
          isDark={isDark}
          badge="PORTAL PRAKTISI HUKUM"
          badgeClass="bg-blue-500/20 text-blue-400 border-blue-500/40"
          badgeIcon={Award}
          title="MITRA ADVOKAT"
          description="Kelola praktik profesional Anda, verifikasi SIPP Mahkamah Agung RI, jadwalkan sesi konsultasi, terbitkan opini hukum ber-eMeterai SHA-256, dan cairkan honorarium via BI-FAST."
          features={[
            'Verifikasi real-time SIPP Mahkamah Agung & PERADI',
            'Penerbitan opini hukum ber-eMeterai SHA-256 sah',
            'Pencairan honor instan BI-FAST tanpa potongan gelap',
          ]}
          btnText="Masuk / Daftar Mitra Advokat"
          btnClass="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-[0_4px_20px_rgba(59,130,246,0.4)] border-0"
          to="/advocate/auth"
          topStripeClass="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400"
          accentColor="blue"
        />
      </div>
    </section>
  );
};
