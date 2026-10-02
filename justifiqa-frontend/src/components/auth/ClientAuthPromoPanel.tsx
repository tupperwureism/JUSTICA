import { Database, Key, Lock, Scale } from 'lucide-react';

const features = [
  [Lock, 'p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40', 'Enkripsi Zero-Knowledge End-to-End', 'Percakapan dan dokumen bukti hukum yang Anda unggah terenkripsi secara fisik sebelum dikirim ke server. Hanya Anda dan Advokat pendamping yang memiliki kunci privat pembuka.'],
  [Key, 'p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40', 'PostgreSQL Mutex Row-Lock Escrow', 'Dana konsultasi dikunci secara mutlak dalam sistem rekening bersama (`SELECT ... FOR UPDATE`) dan tidak dapat dicairkan atau digandakan sebelum verifikasi penyelesaian sesi.'],
  [Database, 'p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40', 'WORM Immutable Audit Trail', 'Setiap diagnosis AI dan somasi yang dirakit dibekukan dengan hash SHA-256 dalam kubah penyimpanan Write-Once-Read-Many yang sah sebagai bukti forensik digital di pengadilan.'],
] as const;

export function ClientAuthPromoPanel() {
  return (
    <div className="auth-promo-panel hidden lg:flex w-full lg:w-1/2 min-h-screen bg-gradient-to-br from-[#0a1128] via-slate-950 to-[#07191d] p-10 xl:p-14 flex-col justify-between relative overflow-hidden z-10">
      <Scale className="absolute -right-20 -bottom-20 w-[640px] h-[640px] text-white/[0.03] pointer-events-none rotate-12" />
      <div className="flex items-center justify-between gap-4 relative z-10"><span className="badge badge-blue font-bold px-3.5 py-1.5 text-xs border border-blue-400/30">Sertifikasi Keamanan ISO 27001</span><span className="badge badge-gold font-bold px-3.5 py-1.5 text-xs border border-amber-400/30">Enkripsi E2EE FIDO2 Ready</span></div>
      <div className="relative z-10 max-w-2xl mx-auto my-auto space-y-8 py-8">
        <div className="space-y-3.5"><h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-snug font-heading">Perlindungan Hukum Digital Terotentikasi &amp; Bebas Risiko Kepalsuan Dokumen</h2><p className="text-sm xl:text-base text-slate-200 leading-relaxed font-medium">Seluruh transaksi konsultasi dan perakitan dokumen di Justica dilindungi protokol kriptografi Zero-Knowledge dan jaminan kepatuhan regulasi hukum nasional.</p></div>
        <div className="grid grid-cols-1 gap-4">{features.map(([Icon, iconClass, title, text]) => <div key={title} className="p-5 rounded-2xl bg-white/5 border border-white/30 backdrop-blur-md flex items-start gap-4 hover:bg-white/10 shadow-lg"><div className={`${iconClass} flex-shrink-0`}><Icon className="w-5 h-5" /></div><div><h4 className="font-bold text-sm text-white">{title}</h4><p className="text-xs text-slate-300 mt-1 leading-relaxed">{text}</p></div></div>)}</div>
      </div>
      <div className="relative z-10 pt-6 border-t border-white/30 flex items-center justify-between gap-4 text-xs text-slate-300"><span className="font-semibold text-white">● Sistem Aktif &amp; Terproteksi WebAuthn Hardened</span><span className="font-mono">Latency: &lt; 1.2s · SLA Uptime: 99.98%</span></div>
    </div>
  );
}
