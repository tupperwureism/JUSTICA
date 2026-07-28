import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { EkycLivenessCamera } from './ekyc/EkycLivenessCamera';
import { EkycOtpPanel } from './ekyc/EkycOtpPanel';
import { EkycOutcomePanel } from './ekyc/EkycOutcomePanel';
import { E_KYC_STEPS, type EkycOutcome, type EkycScreen } from './ekyc/ekycUiModel';

interface EkycVerificationWizardProps {
  userRole: 'client' | 'advocate';
  providerName?: 'VIDA' | 'Verihubs' | 'ASLI_RI';
}

export function EkycVerificationWizard({ userRole, providerName = 'VIDA' }: EkycVerificationWizardProps) {
  const [otp, setOtp] = useState('');
  const [screen, setScreen] = useState<EkycScreen>('otp');
  const [failures, setFailures] = useState(0);
  const step = screen === 'otp' ? 0 : screen === 'liveness' ? 1 : 2;

  const resolveOutcome = (outcome: EkycOutcome) => {
    if (outcome === 'passed') return setScreen('verified');
    if (outcome === 'hold') return setScreen('hold');
    if (outcome === 'refunded') return setScreen('refunded');
    const nextFailures = failures + 1;
    setFailures(nextFailures);
    setScreen(nextFailures >= 3 ? 'refunded' : 'hold');
  };

  return (
    <section className="ekyc-suite-shell" aria-label="Verifikasi e-KYC forensik">
      <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline" className="ekyc-step-chip">e-KYC {userRole === 'client' ? 'Klien' : 'Advokat'}</Badge><span className="text-sm font-semibold text-muted-foreground">Provider: {providerName} · sandbox UI</span></div>
      <ol className="grid gap-3 sm:grid-cols-3" aria-label="Tahapan verifikasi">{E_KYC_STEPS.map((label, index) => <li key={label} className={`ekyc-step-chip ${index <= step ? 'active' : ''}`}>{index + 1}. {label}</li>)}</ol>
      {screen === 'otp' && <EkycOtpPanel otp={otp} onChange={setOtp} onContinue={() => setScreen('liveness')} />}
      {screen === 'liveness' && <EkycLivenessCamera attempt={failures + 1} onOutcome={resolveOutcome} />}
      {screen !== 'otp' && screen !== 'liveness' && <EkycOutcomePanel screen={screen} failures={failures} onRetry={() => setScreen('liveness')} onRefund={() => resolveOutcome('refunded')} />}
    </section>
  );
}
