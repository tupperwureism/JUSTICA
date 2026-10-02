import { KeyRound, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActiveDevicesTable } from './ActiveDevicesTable';

export function SecuritySettingsPanel() {
  return (
    <section className="settings-panel">
      <div>
        <h3 className="dispute-section-title">Kredensial &amp; Autentikasi Multi-Faktor (MFA)</h3>
        <div className="settings-summary-card mt-4">
          <div className="settings-summary-row"><span>Status MFA Saat Ini</span><strong className="inline-flex items-center gap-2 text-emerald-500"><ShieldCheck className="size-4" />AKTIF (WHATSAPP &amp; AUTHENTICATOR APP)</strong></div>
          <div className="settings-summary-row"><span>Nomor WhatsApp Terdaftar</span><strong className="font-mono">+6281234567890 (Verified)</strong></div>
          <div className="settings-summary-row"><span>Kata Sandi Akses</span><strong className="font-mono">••••••••••••••••••••••••</strong></div>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Button type="button" onClick={() => window.alert('Alur perubahan kata sandi Argon2id akan memerlukan verifikasi MFA aktif.')} className="dispute-action dispute-primary-action"><KeyRound />UBAH KATA SANDI UTAMA</Button>
            <Button type="button" variant="outline" onClick={() => window.alert('Pasangan perangkat Authenticator akan diatur ulang melalui QR terverifikasi.')} className="dispute-action dispute-secondary-action"><RotateCcw />ATUR ULANG PERANGKAT MFA</Button>
          </div>
        </div>
      </div>
      <div><h3 className="dispute-section-title mb-4">Daftar Perangkat Ber-Token AES-256 Aktif</h3><ActiveDevicesTable /></div>
    </section>
  );
}
