import { CheckCircle2, FileSignature, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEkycIntegration } from '@/hooks/useEkycIntegration';
import { EkycVerificationFlow } from './EkycVerificationWizard';
import { scopeEkycWorkspaceToDocument } from './ekyc/ekycUiModel';

export type SigningParty = {
  id: string;
  name: string;
  role: 'CLIENT' | 'ADVOCATE' | 'NOTARY' | 'WITNESS';
  status: 'PENDING' | 'SIGNED' | 'REJECTED';
};

interface MultiPartySigningPanelProps {
  documentTitle: string;
  parties: SigningParty[];
  userRole?: 'client' | 'advocate';
}

export function MultiPartySigningPanel({
  documentTitle, parties: plannedParties, userRole = 'client',
}: MultiPartySigningPanelProps) {
  const integration = useEkycIntegration();
  const workspace = scopeEkycWorkspaceToDocument(
    integration.workspace.data,
    documentTitle,
  );
  const parties = workspace?.parties.map((party) => ({
    id: party.id,
    name: party.email,
    role: party.role,
    status: party.status,
  })) ?? plannedParties.map((party) => ({ ...party, status: 'PENDING' }));
  const refresh = () => { void integration.workspace.refresh().catch(() => undefined); };

  return (
    <Card className="w-full rounded-2xl border-border bg-card p-6 sm:p-8">
      <CardHeader className="gap-3 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline">TTE MULTI-PIHAK</Badge><Badge variant={workspace?.status === 'COMPLETED' ? 'default' : 'secondary'}>{workspace?.status ?? 'NOT_CREATED'}</Badge></div>
        <CardTitle className="flex items-center gap-3 text-xl"><FileSignature className="size-6 text-primary" />{documentTitle}</CardTitle>
        <CardDescription>{workspace ? `Envelope ${workspace.envelopeId} diproyeksikan dari backend ${workspace.providerName}.` : 'Rencana signer belum menjadi envelope. Pembuatan envelope memerlukan boundary server yang belum tersedia untuk browser.'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-0">
        <div className="flex flex-wrap gap-2" aria-label="Provider TTE"><Button type="button" variant="outline" size="sm" disabled>{workspace?.providerName ?? 'Provider ditentukan server'}</Button></div>
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {parties.map((party, index) => <li key={party.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-foreground">{index + 1}. {party.name}</p><p className="text-sm text-muted-foreground">{party.role}</p></div><Badge variant={party.status === 'SIGNED' ? 'default' : party.status === 'REJECTED' ? 'destructive' : 'outline'}>{party.status === 'SIGNED' && <CheckCircle2 />}{party.status}</Badge></li>)}
        </ul>
        <div className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><span>Provider mengendalikan sertifikat dan kunci privat. Justica hanya membaca status, recipient ID, timestamp, dan digest dokumen melalui RLS.</span></div>
        {integration.workspace.error && <p role="alert" className="text-sm text-destructive">{integration.workspace.error}</p>}
        <EkycVerificationFlow userRole={userRole} integration={integration} workspace={workspace} />
      </CardContent>
      <CardFooter className="p-0"><Button type="button" size="lg" className="w-full" disabled={integration.workspace.isLoading} onClick={refresh}><RefreshCw />{integration.workspace.isLoading ? 'Memuat envelope...' : workspace ? 'Perbarui status envelope' : 'Periksa envelope dari server'}</Button></CardFooter>
    </Card>
  );
}
