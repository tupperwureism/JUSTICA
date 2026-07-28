import { Check, Circle, Clock3, Landmark, LockKeyhole, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CLIENT_STAGE_COPY, CORPORATE_STAGES, type CorporateCaseStage } from './corporateUiModel';

type Props = {
  caseCode?: string;
  entityName?: string;
  currentStage?: CorporateCaseStage;
  externalReference?: string | null;
};

export function CorporateCaseTrackerPanel({
  caseCode = 'JBIZ-202607-001',
  entityName = 'PT Contoh Usaha Indonesia',
  currentStage = 'NOTARY_REVIEW',
  externalReference = 'SABH-PENDING-2026',
}: Props) {
  const currentIndex = CORPORATE_STAGES.findIndex(([key]) => key === currentStage);
  const status = CLIENT_STAGE_COPY[currentStage];
  const statusClass = currentStage === 'ESCROW_LOCKED' ? 'corporate-status-locked' : currentStage === 'NOTARY_REVIEW' ? 'corporate-status-review' : currentStage === 'COMPLIANCE_HOLD' ? 'corporate-status-hold' : currentStage === 'COMPLETED' ? 'corporate-status-success' : 'corporate-status-draft';
  return (
    <Card className="mx-auto w-full max-w-4xl gap-6 rounded-2xl border-border bg-card p-6 shadow-md sm:p-8">
      <CardHeader className="gap-3 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline" className="min-h-7 px-3"><Landmark />Pelacakan Corporate Intake</Badge><Badge variant="secondary">{caseCode}</Badge></div>
        <CardTitle className="text-2xl font-extrabold">{entityName}</CardTitle>
        <CardDescription>Hanya status operasional yang aman bagi klien. Risk score, red flag, keputusan CDD, dan data pelaporan tidak pernah ditampilkan.</CardDescription>
        <div className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${statusClass}`}><Badge variant="outline" className="corporate-status-badge"><LockKeyhole />{status.label}</Badge><span className="text-sm font-semibold">{status.detail}</span></div>
      </CardHeader>
      <CardContent className="grid gap-3 p-0 md:grid-cols-2">
        {CORPORATE_STAGES.map(([key, label], index) => {
          const done = currentIndex >= 0 && index < currentIndex;
          const active = index === currentIndex;
          return <div key={key} className={`flex items-center gap-3 rounded-xl border p-3 ${active ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${done || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{done ? <Check className="size-4" /> : active ? <Clock3 className="size-4" /> : <Circle className="size-4" />}</span>
            <span><strong className="block text-sm">{label}</strong><small className="text-muted-foreground">{active ? 'Sedang diproses' : done ? 'Selesai' : 'Menunggu'}</small></span>
          </div>;
        })}
      </CardContent>
      {externalReference && <p className="rounded-xl border border-border bg-muted/40 p-3 text-sm"><strong>Referensi eksternal:</strong> {externalReference}</p>}
      {currentStage === 'COMPLIANCE_HOLD' && <p className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-foreground"><ShieldAlert className="size-4 shrink-0" />Dana escrow tetap terlindungi selama proses ditahan.</p>}
    </Card>
  );
}
