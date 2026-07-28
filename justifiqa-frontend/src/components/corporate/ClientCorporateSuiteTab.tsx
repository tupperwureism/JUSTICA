import { useState } from 'react';
import { CorporateCaseTrackerPanel } from './CorporateCaseTrackerPanel';
import { CorporateEscrowCheckoutPanel } from './CorporateEscrowCheckoutPanel';
import { CorporateIntakeWizard } from './CorporateIntakeWizard';

export function ClientCorporateSuiteTab() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [locked, setLocked] = useState(false);
  const [entityName, setEntityName] = useState('');
  return (
    <div className="corporate-suite-shell animate-fade-in">
      <CorporateIntakeWizard onComplete={(draft) => { setEntityName(draft.businessName); setShowCheckout(true); }} />
      {showCheckout && <CorporateEscrowCheckoutPanel entityName={entityName} locked={locked} onPay={() => setLocked(true)} />}
      {showCheckout && <CorporateCaseTrackerPanel entityName={entityName || undefined} currentStage={locked ? 'ESCROW_LOCKED' : 'DRAFT'} externalReference={null} />}
    </div>
  );
}
