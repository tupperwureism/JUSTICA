import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CorporateCaseTrackerPanel } from '@/components/corporate/CorporateCaseTrackerPanel';
import { CorporateEscrowCheckoutPanel } from '@/components/corporate/CorporateEscrowCheckoutPanel';
import { CorporateIntakeWizard } from '@/components/corporate/CorporateIntakeWizard';
import { NotaryCaseWorkspacePanel } from '@/components/corporate/notary/NotaryCaseWorkspacePanel';
import { EkycVerificationWizard } from '@/components/signing/EkycVerificationWizard';
import { EkycLivenessCamera } from '@/components/signing/ekyc/EkycLivenessCamera';
import { EkycOutcomePanel } from '@/components/signing/ekyc/EkycOutcomePanel';

type ShowcaseTab = 'corporate' | 'ekyc';

export function DevShowcasePage() {
  const [tab, setTab] = useState<ShowcaseTab>('corporate');
  const [escrowLocked, setEscrowLocked] = useState(false);
  return (
    <main className="dev-showcase-shell">
      <div className="dev-showcase-inner">
        <header className="dev-showcase-header">
          <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline">Development only</Badge><Badge variant="secondary">No Auth · No Supabase request</Badge></div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Phase 2 Visual QA Showcase</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">Render mandiri untuk audit UI Batch 6 dan Batch 7. Semua data adalah dummy lokal; rute aplikasi normal tetap dilindungi autentikasi.</p>
        </header>
        <nav className="dev-showcase-tabs" aria-label="Pilih batch showcase">
          <Button type="button" variant={tab === 'corporate' ? 'default' : 'outline'} onClick={() => setTab('corporate')} className={`dev-showcase-tab ${tab === 'corporate' ? 'active' : ''}`}>Batch 6 · Corporate Intake</Button>
          <Button type="button" variant={tab === 'ekyc' ? 'default' : 'outline'} onClick={() => setTab('ekyc')} className={`dev-showcase-tab ${tab === 'ekyc' ? 'active' : ''}`}>Batch 7 · e-KYC Forensik</Button>
        </nav>
        {tab === 'corporate' && <section className="dev-showcase-section">
          <CorporateIntakeWizard onComplete={() => {}} />
          <CorporateEscrowCheckoutPanel entityName="PT Justifiqa Inovasi Nusantara" locked={escrowLocked} onPay={() => setEscrowLocked(true)} />
          <CorporateCaseTrackerPanel caseCode="JBIZ-QA-001" entityName="PT Justifiqa Inovasi Nusantara" currentStage={escrowLocked ? 'ESCROW_LOCKED' : 'DRAFT'} externalReference={null} />
          <CorporateCaseTrackerPanel caseCode="JBIZ-QA-HOLD" entityName="PT Contoh Compliance" currentStage="COMPLIANCE_HOLD" externalReference={null} />
          <NotaryCaseWorkspacePanel hasNotaryAssignment />
        </section>}
        {tab === 'ekyc' && <section className="dev-showcase-section">
          <EkycVerificationWizard userRole="client" providerName="VIDA" />
          <EkycLivenessCamera attempt={2} onOutcome={() => undefined} />
          <EkycOutcomePanel screen="verified" failures={0} onRetry={() => undefined} onRefund={() => undefined} />
          <EkycOutcomePanel screen="hold" failures={2} onRetry={() => undefined} onRefund={() => undefined} />
          <EkycOutcomePanel screen="refunded" failures={3} onRetry={() => undefined} onRefund={() => undefined} />
        </section>}
      </div>
    </main>
  );
}
