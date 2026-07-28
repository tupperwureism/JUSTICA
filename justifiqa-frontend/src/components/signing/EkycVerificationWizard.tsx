import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEkycIntegration } from '@/hooks/useEkycIntegration';
import type { EkycWorkspace } from '@/services/phase2IntegrationService';
import { EkycLivenessCamera } from './ekyc/EkycLivenessCamera';
import { EkycOtpPanel } from './ekyc/EkycOtpPanel';
import { EkycOutcomePanel } from './ekyc/EkycOutcomePanel';
import { E_KYC_STEPS, resolveEkycScreen } from './ekyc/ekycUiModel';

interface EkycVerificationWizardProps {
  userRole: 'client' | 'advocate';
  providerName?: 'VIDA' | 'Verihubs' | 'ASLI_RI';
}

type EkycVerificationFlowProps = EkycVerificationWizardProps & {
  integration: ReturnType<typeof useEkycIntegration>;
  workspace: EkycWorkspace | null;
};

export function EkycVerificationFlow({
  userRole, providerName = 'VIDA', integration, workspace,
}: EkycVerificationFlowProps) {
  const [otp, setOtp] = useState('');
  const screen = resolveEkycScreen(
    workspace?.globalStatus,
    workspace?.status,
    workspace?.currentVerification?.status,
  );
  const failures = workspace?.currentVerification?.attemptCount ?? 0;
  const step = screen === 'otp' ? 0 : screen === 'liveness' ? 1 : 2;
  const refresh = () => { void integration.workspace.refresh().catch(() => undefined); };
  const beginProvider = () => {
    if (!workspace) return;
    void integration.providerSession.execute({
      envelopeId: workspace.envelopeId,
      otp,
    }).catch(() => undefined);
  };

  return (
    <section className="ekyc-suite-shell" aria-label="Verifikasi e-KYC forensik">
      <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline" className="ekyc-step-chip">e-KYC {userRole === 'client' ? 'Klien' : 'Advokat'}</Badge><span className="text-sm font-semibold text-muted-foreground">Provider: {workspace?.providerName ?? providerName} · status kanonik Supabase</span></div>
      <ol className="grid gap-3 sm:grid-cols-3" aria-label="Tahapan verifikasi">{E_KYC_STEPS.map((label, index) => <li key={label} className={`ekyc-step-chip ${index <= step ? 'active' : ''}`}>{index + 1}. {label}</li>)}</ol>
      {integration.workspace.isLoading && <p role="status" className="ekyc-status-safe">Memuat envelope dan hasil e-KYC terotorisasi...</p>}
      {integration.workspace.error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"><span>{integration.workspace.error}</span><Button type="button" variant="outline" size="sm" onClick={refresh}>Coba lagi</Button></div>}
      {!integration.workspace.isLoading && !workspace && <p role="alert" className="ekyc-status-safe ekyc-status-hold">Envelope belum dibuat oleh boundary server terotorisasi. Proses e-KYC tidak dapat dimulai dari browser.</p>}
      {workspace && screen === 'otp' && <EkycOtpPanel otp={otp} onChange={setOtp} onContinue={beginProvider} loading={integration.providerSession.isLoading} error={integration.providerSession.error} onRetry={() => { void integration.providerSession.retry().catch(() => undefined); }} />}
      {workspace && screen === 'liveness' && <EkycLivenessCamera attempt={failures + 1} onRefresh={refresh} loading={integration.workspace.isLoading} error={integration.workspace.error} />}
      {workspace && screen !== 'otp' && screen !== 'liveness' && <EkycOutcomePanel screen={screen} failures={failures} onRefresh={refresh} loading={integration.workspace.isLoading} error={integration.workspace.error} />}
    </section>
  );
}

export function EkycVerificationWizard(props: EkycVerificationWizardProps) {
  const integration = useEkycIntegration();
  return (
    <EkycVerificationFlow
      {...props}
      integration={integration}
      workspace={integration.workspace.data}
    />
  );
}
