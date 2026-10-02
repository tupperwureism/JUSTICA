import { CheckCircle2, FileKey2, Fingerprint, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  idempotencyKey?: string;
  peruriSerial: string;
  bifastReference?: string;
  status: 'NOT_STARTED' | 'INITIATED' | 'SUCCESS' | 'FAILED';
}

const STATUS_LABEL = {
  NOT_STARTED: 'BELUM DICAIRKAN',
  INITIATED: 'MENUNGGU PENCAIRAN',
  SUCCESS: 'PENCAIRAN BERHASIL',
  FAILED: 'PERLU REKONSILIASI',
} as const;

export function EscrowDisbursementTrackerPanel({ idempotencyKey, peruriSerial, bifastReference, status }: Props) {
  return (
    <Card className="gap-5 rounded-2xl border-border bg-secondary/30 p-5 shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-4 p-0">
        <div>
          <CardTitle className="font-heading text-base font-extrabold">Tracker Pencairan Rekening Bersama</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Mutex database dan kunci idempotensi mencegah pencairan ganda.</p>
        </div>
        <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/10 px-3.5 py-1 text-primary">{STATUS_LABEL[status]}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3 p-0 text-xs">
        <div className="flex items-start gap-3"><Fingerprint className="size-4 shrink-0 text-primary" /><span className="min-w-0"><strong className="block text-foreground">Idempotency Key</strong><code className="break-all text-muted-foreground">{idempotencyKey ?? 'Dibuat server saat instruksi payout dimulai'}</code></span></div>
        <div className="flex items-start gap-3"><FileKey2 className="size-4 shrink-0 text-primary" /><span><strong className="block text-foreground">Audit e-Meterai PERURI</strong><span className="text-muted-foreground">{peruriSerial}</span></span></div>
        <div className="flex items-start gap-3"><Landmark className="size-4 shrink-0 text-primary" /><span><strong className="block text-foreground">Referensi BI-FAST</strong><span className="text-muted-foreground">{bifastReference ?? 'Diterbitkan setelah settlement provider'}</span></span></div>
        <p className="flex items-center gap-2 border-t border-border pt-3 text-muted-foreground"><CheckCircle2 className="size-4 shrink-0 text-primary" />Panggilan provider dijalankan setelah transaksi mutex selesai commit.</p>
      </CardContent>
    </Card>
  );
}
