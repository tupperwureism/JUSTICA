import { ClockAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FairClockGuardrailModalProps {
  onClose: () => void;
}

export function FairClockGuardrailModal({ onClose }: FairClockGuardrailModalProps) {
  return (
    <div className="client-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="fair-clock-title">
      <div className="client-modal-shell max-w-xl">
        <header className="client-modal-header">
          <div className="flex items-center gap-3"><ClockAlert className="size-5 text-amber-500" /><h2 id="fair-clock-title" className="font-heading text-lg font-extrabold">SLA Guardrail Fair-Clock</h2></div>
          <button type="button" onClick={onClose} className="client-modal-close" aria-label="Tutup"><X /></button>
        </header>
        <div className="p-6 sm:p-8 flex flex-col gap-5">
          <div className="fair-clock-guardrail">
            Jeda maksimal adalah <strong>15 menit per kejadian</strong>. Sistem otomatis melanjutkan waktu setelah batas tercapai.
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Akumulasi jeda maksimal 30 menit per sesi.</li>
            <li>Kedua pihak menerima notifikasi E2EE saat auto-resume.</li>
            <li>AFK Advokat melewati SLA dapat menjadi dasar klaim refund 100%.</li>
          </ol>
          <Button type="button" onClick={onClose} className="consultation-action consultation-pause-action">PAHAMI BATAS JEDA 15 MENIT</Button>
        </div>
      </div>
    </div>
  );
}
