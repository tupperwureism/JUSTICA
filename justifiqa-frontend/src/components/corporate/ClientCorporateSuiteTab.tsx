import { Button } from '@/components/ui/button';
import { useClientCorporateIntegration } from '@/hooks/useClientCorporateIntegration';
import { CorporateCaseTrackerPanel } from './CorporateCaseTrackerPanel';
import { CorporateEscrowCheckoutPanel } from './CorporateEscrowCheckoutPanel';
import { CorporateIntakeWizard } from './CorporateIntakeWizard';
import type { CorporateCaseStage } from './corporateUiModel';

const clientStage = (stage: string): CorporateCaseStage => {
  if (stage === 'CUSTOMER_ACTION_REQUIRED' || stage === 'COMPLIANCE_HOLD' || stage === 'COMPLETED') return stage;
  if (stage === 'DRAFT' || stage === 'CANCELLED') return 'DRAFT';
  if (stage === 'ESCROW_LOCKED' || stage === 'IDENTITY_PENDING' || stage === 'CDD_REVIEW' || stage === 'DOCUMENTS_PENDING') return 'ESCROW_LOCKED';
  return 'NOTARY_REVIEW';
};

export function ClientCorporateSuiteTab() {
  const integration = useClientCorporateIntegration();
  const workspace = integration.workspace.data;
  return (
    <div className="corporate-suite-shell animate-fade-in">
      <CorporateIntakeWizard
        onComplete={integration.intake.execute}
        submitting={integration.intake.isLoading}
        error={integration.intake.error}
        onRetry={() => { void integration.intake.retry().catch(() => undefined); }}
      />
      {integration.workspace.isLoading && <p role="status" className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Memuat kasus Corporate Intake terotorisasi...</p>}
      {integration.workspace.error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"><span>{integration.workspace.error}</span><Button type="button" variant="outline" size="sm" onClick={() => { void integration.workspace.refresh().catch(() => undefined); }}>Coba lagi</Button></div>}
      {workspace && <CorporateEscrowCheckoutPanel
        entityName={workspace.entityName}
        amount={workspace.escrow.totalAmountIdr}
        paymentReference={workspace.escrow.paymentGatewayRef}
        status={workspace.escrow.status}
        loading={integration.escrow.isLoading}
        error={integration.escrow.error}
        success={integration.escrow.status === 'success'}
        onRefresh={() => { void integration.escrow.execute(workspace.caseId).catch(() => undefined); }}
        onRetry={() => { void integration.escrow.retry().catch(() => undefined); }}
      />}
      {workspace && <CorporateCaseTrackerPanel caseCode={workspace.caseId} entityName={workspace.entityName} currentStage={clientStage(workspace.currentStage)} externalReference={workspace.externalReference} />}
    </div>
  );
}
