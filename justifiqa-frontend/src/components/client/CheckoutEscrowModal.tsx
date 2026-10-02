import React, { useMemo, useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { CheckoutOrderForm } from './CheckoutOrderForm';
import { CheckoutPaymentInstructions } from './CheckoutPaymentInstructions';
import { CheckoutSuccessReceipt } from './CheckoutSuccessReceipt';
import { PaymentGatewaySelectorModal, type PaymentGatewayMethod } from '@/components/payment/PaymentGatewaySelectorModal';
import type { CheckoutDraft } from '@/types/client';

type CheckoutStep = 'form' | 'gateway' | 'instructions' | 'success';

interface CheckoutEscrowModalProps {
  draft: CheckoutDraft;
  onClose: () => void;
  onEnterConsultationRoom: () => void;
}

const STEP_TITLES: Record<CheckoutStep, string> = {
  form: 'Konfirmasi Pemesanan Konsultasi',
  gateway: 'Pilih Payment Gateway Aman',
  instructions: 'Instruksi Pembayaran Escrow',
  success: 'Pembayaran Berhasil Diverifikasi',
};

export const CheckoutEscrowModal: React.FC<CheckoutEscrowModalProps> = ({
  draft,
  onClose,
  onEnterConsultationRoom,
}) => {
  const [step, setStep] = useState<CheckoutStep>('form');
  const [proBonoApproved, setProBonoApproved] = useState(false);
  const [gateway, setGateway] = useState<PaymentGatewayMethod>('VA_MANDIRI_BCA');
  const invoiceId = useMemo(() => `INV-202607-${Math.floor(100 + Math.random() * 900)}`, []);
  const receiptHash = useMemo(
    () => `SHA256:${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}...`,
    []
  );

  const approveProBono = () => {
    setProBonoApproved(true);
    setStep('success');
  };

  return (
    <div className="client-modal-overlay">
      <div className="client-modal-shell max-w-2xl">
        <header className="client-modal-header">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-foreground font-heading truncate">
              {STEP_TITLES[step]}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="client-modal-close">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="client-modal-body-scroll">
          {step === 'form' && (
            <CheckoutOrderForm draft={draft} onPay={() => setStep('gateway')} onProBonoApproved={approveProBono} />
          )}
          {step === 'gateway' && <PaymentGatewaySelectorModal onConfirm={(method) => { setGateway(method); setStep('instructions'); }} />}
          {step === 'instructions' && (
            <CheckoutPaymentInstructions draft={draft} invoiceId={invoiceId} gateway={gateway} onSuccess={() => setStep('success')} />
          )}
          {step === 'success' && (
            <CheckoutSuccessReceipt draft={draft} receiptHash={receiptHash} proBono={proBonoApproved} onEnter={onEnterConsultationRoom} />
          )}
        </div>
      </div>
    </div>
  );
};
