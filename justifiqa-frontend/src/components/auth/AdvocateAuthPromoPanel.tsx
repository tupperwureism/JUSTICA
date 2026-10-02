import { Award, Briefcase, Database, Key } from 'lucide-react';

const features = [
  [Award, 'p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40', 'Otentikasi SIPP & PERADI Real-Time', 'Sinkronisasi langsung dengan pangkalan data Mahkamah Agung memastikan hanya advokat berlisensi aktif yang dapat membuka sesi konsultasi atau menerbitkan opini yuridis.'],
  [Key, 'p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40', 'Sesi FIDO2 WebAuthn & Hardware HSM', 'Setiap aksi penandatanganan dokumen dan pelepasan dana Escrow memerlukan otorisasi MFA dan verifikasi token perangkat keras fisik.'],
  [Database, 'p-3 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40', 'Kubah WORM Audit Trail & Bukti Forensik', 'Semua somasi, gugatan, dan log konsultasi dienkripsi SHA-256 dan disimpan dalam kubah Immutable Write-Once-Read-Many.'],
] as const;

export function AdvocateAuthPromoPanel() {
  return (
    <div className="auth-promo-panel hidden lg:flex w-full lg:w-1/2 min-h-screen bg-gradient-to-br from-slate-900 via-[#07191d] to-slate-950 p-10 xl:p-14 flex-col justify-between relative overflow-hidden z-10">
      <Briefcase className="absolute -right-20 -bottom-20 w-[640px] h-[640px] text-white/[0.03] pointer-events-none rotate-12" />
      <div className="flex items-center justify-between gap-4 relative z-10"><span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold px-3.5 py-1.5 text-xs">Verifikasi SIPP Mahkamah Agung</span><span className="badge badge-blue font-bold px-3.5 py-1.5 text-xs border border-blue-400/30">KMS e-Meterai Peruri</span></div>
      <div className="relative z-10 max-w-2xl mx-auto my-auto space-y-8 py-8">
        <div className="space-y-3.5"><h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-snug font-heading">Infrastruktur Praktik Hukum Digital Terproteksi Tingkat Tinggi SIPP MA</h2><p className="text-sm xl:text-base text-slate-200 leading-relaxed font-medium">Portal khusus bagi Advokat tersumpah PERADI untuk mengelola sesi konsultasi klien, diagnosis hukum AI, serta otentikasi dokumen e-Meterai resmi.</p></div>
        <div className="grid grid-cols-1 gap-4">{features.map(([Icon, iconClass, title, text]) => <div key={title} className="p-5 rounded-2xl bg-white/5 border border-white/30 backdrop-blur-md flex items-start gap-4 hover:bg-white/10 shadow-lg"><div className={iconClass}><Icon className="w-5 h-5" /></div><div><h4 className="font-bold text-sm text-white">{title}</h4><p className="text-xs text-slate-300 mt-1 leading-relaxed">{text}</p></div></div>)}</div>
      </div>
      <div className="relative z-10 pt-6 border-t border-white/30 flex items-center justify-between gap-4 text-xs text-slate-300"><span className="font-semibold text-white">● Command Center Advokat Aktif &amp; Terproteksi HSM</span><span className="font-mono">Peruri KMS API: Connected · Mutex Engine: Ready</span></div>
    </div>
  );
}
