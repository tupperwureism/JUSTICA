import React, { useState } from 'react';
import { CheckoutOrderSummary } from './CheckoutOrderSummary';
import { getEscrowTotal } from './checkoutPricing';
import { EscrowPaymentForm } from './EscrowPaymentForm';
import { ProBonoApplicationForm } from './ProBonoApplicationForm';
import type { CheckoutDraft } from '@/types/client';

export const CheckoutOrderForm: React.FC<{ draft: CheckoutDraft; onPay: () => void; onProBonoApproved: () => void }> = (props) => {
  const [mode, setMode] = useState<'escrow' | 'probono'>('escrow');
  return <div className="space-y-6">
    <CheckoutOrderSummary draft={props.draft} />
    <div className="flex rounded-2xl bg-secondary p-1.5 border border-border">
      <button type="button" onClick={() => setMode('escrow')} className={`client-mode-tab ${mode === 'escrow' ? 'active' : ''}`}>Pembayaran Escrow</button>
      <button type="button" onClick={() => setMode('probono')} className={`client-mode-tab ${mode === 'probono' ? 'active' : ''}`}>Pengajuan Pro Bono</button>
    </div>
    {mode === 'escrow' ? <EscrowPaymentForm price={getEscrowTotal(props.draft.service.price)} onPay={props.onPay} /> : <ProBonoApplicationForm onApproved={props.onProBonoApproved} />}
  </div>;
};
