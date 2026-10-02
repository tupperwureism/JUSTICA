import { AlertCircle, Clock, Lock, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdvocateE2EEHeaderAndSlaProps {
  clockSeconds: number;
  formatClock: (sec: number) => string;
  isClockPaused: boolean;
  onTogglePause: () => void;
  pauseCount: number;
}

export function AdvocateE2EEHeaderAndSla({ clockSeconds, formatClock, isClockPaused, onTogglePause, pauseCount }: AdvocateE2EEHeaderAndSlaProps) {
  return (
    <div className="space-y-4">
      <Card className="flex flex-col justify-between gap-4 rounded-3xl border-border bg-card p-6 shadow-xl sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/15 text-blue-500"><Lock /></span>
          <div><h2 className="font-heading text-xl font-extrabold">SESI KONSULTASI HUKUM AKTIF • PT MITRA JAYA</h2><p className="text-xs text-muted-foreground">Percakapan diamankan dengan enkripsi E2EE AES-GCM 256-Bit &amp; Hardware-bound Session Token</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3">
          <Clock className="shrink-0 animate-pulse text-emerald-500" />
          <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Sisa Waktu Sesi (Fair-Clock)</p><p className="font-mono text-lg font-extrabold">{formatClock(clockSeconds)}</p></div>
          <Button type="button" size="sm" variant={isClockPaused ? 'destructive' : 'outline'} onClick={onTogglePause} className="min-h-10 whitespace-nowrap rounded-xl font-bold">
            {isClockPaused ? <Play /> : <Pause />}{isClockPaused ? 'Lanjutkan Sesi' : 'Jeda Sesi (Fair-Clock)'}
          </Button>
        </div>
      </Card>
      <Card className="flex items-start gap-3 rounded-2xl border-amber-500/40 bg-amber-500/10 p-4 text-xs text-foreground">
        <AlertCircle className="mt-0.5 shrink-0 text-amber-500" />
        <div><h3 className="text-[11px] font-bold uppercase tracking-wider">ATURAN FAIR-CLOCK &amp; 3 LAPIS PENGAMAN SLA (SLA GUARDRAILS):</h3><ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground"><li><strong className="text-foreground">Lapis 1 (Maks. 15 Menit/Jeda):</strong> Jika jeda melebihi 15 menit, arloji otomatis berjalan (*Auto-Resume*).</li><li><strong className="text-foreground">Lapis 2 (Maks. Akumulasi 30 Menit/Sesi):</strong> Anda telah menggunakan <span className="font-bold text-amber-500">{pauseCount} / 2</span> kesempatan jeda.</li><li><strong className="text-foreground">Lapis 3 (Anti-Malpractice):</strong> Jeda digunakan untuk meninjau lampiran/bukti hukum Klien agar waktu berbayar tidak tergerus sia-sia.</li></ul></div>
      </Card>
    </div>
  );
}
