import { useState } from 'react';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrivacySettingsPanel() {
  const [anonymizeReviews, setAnonymizeReviews] = useState(true);
  const [emailSummary, setEmailSummary] = useState(false);

  return (
    <section className="settings-panel">
      <h3 className="dispute-section-title">Kontrol Data Pribadi &amp; Right to be Forgotten (UU PDP)</h3>
      <div className="flex flex-col gap-3">
        <label className="settings-privacy-option"><input type="checkbox" checked={anonymizeReviews} onChange={(event) => setAnonymizeReviews(event.target.checked)} /><span>Izinkan anonimisasi nama saya pada ulasan publik advokat secara default.</span></label>
        <label className="settings-privacy-option"><input type="checkbox" checked={emailSummary} onChange={(event) => setEmailSummary(event.target.checked)} /><span>Kirimkan ringkasan analitis sesi konsultasi ke email pribadi saya.</span></label>
      </div>
      <div className="settings-danger-zone">
        <div className="flex items-start gap-4">
          <ShieldAlert className="size-7 shrink-0 text-red-500" />
          <div><h4 className="font-heading text-lg font-extrabold text-red-500">Zona Penghapusan Akun — Right to be Forgotten</h4><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Sesuai Pasal 8 UU PDP No. 27/2022, Anda berhak mengajukan penghapusan data pribadi setelah seluruh perkara dan kewajiban Escrow selesai.</p></div>
        </div>
        <Button type="button" onClick={() => window.alert('Permintaan penghapusan dicatat untuk verifikasi hukum dan penyelesaian kewajiban Escrow sebelum permanent wipe.')} className="dispute-action dispute-danger-action mt-5 w-full"><Trash2 />AJUKAN PENGHAPUSAN DATA PRIBADI &amp; TUTUP AKUN</Button>
      </div>
    </section>
  );
}
