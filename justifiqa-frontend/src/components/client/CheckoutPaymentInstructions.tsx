import React, { useState } from 'react';
import { CheckCircle2, Clock, Copy, FileCheck2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, getEscrowTotal } from './checkoutPricing';
import type { CheckoutDraft } from '@/types/client';
import type { PaymentGatewayMethod } from '@/components/payment/PaymentGatewaySelectorModal';

const ACCOUNTS = [
  { bank: 'Bank BCA', number: '88921 081234567890' },
  { bank: 'Bank Mandiri', number: '89022 081234567890' },
];

const GATEWAY_LABEL: Record<PaymentGatewayMethod, string> = {
  VA_MANDIRI_BCA: 'Virtual Account Mandiri / BCA',
  QRIS: 'QRIS',
  BI_FAST_ADAPTER: 'BI-FAST Adapter',
};

interface Props { draft: CheckoutDraft; invoiceId: string; gateway: PaymentGatewayMethod; onSuccess: () => void }

export const CheckoutPaymentInstructions: React.FC<Props> = ({ draft, invoiceId, gateway, onSuccess }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const copyAccount = (bank: string, number: string) => {
    void navigator.clipboard?.writeText(number.replace(/\s/g, '')).catch(() => undefined);
    setCopied(bank);
    window.setTimeout(() => setCopied(null), 1500);
  };
  return <div className="space-y-6">
    <div className="rounded-2xl border border-border bg-secondary/40 p-5 space-y-2 text-sm">
      <div className="client-summary-row"><span>ID Tagihan</span><strong className="font-mono">{invoiceId}</strong></div>
      <div className="client-summary-row"><span>Layanan Konsultasi</span><strong>{draft.advocate.name} ({draft.service.duration})</strong></div>
      <div className="client-summary-row"><span>Jalur Pembayaran</span><strong>{GATEWAY_LABEL[gateway]}</strong></div>
      <div className="client-summary-row pt-2 border-t border-border"><span>Total Pembayaran</span><strong className="text-lg text-primary">{formatCurrency(getEscrowTotal(draft.service.price))}</strong></div>
    </div>
    <div className="flex items-center gap-2 text-xs font-bold text-primary"><Clock className="w-4 h-4 shrink-0" /><span>Selesaikan pembayaran dalam 15 menit agar slot tetap terkunci.</span></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="client-payment-panel items-center justify-center text-center"><div className="w-32 h-32 rounded-xl bg-card border border-border flex items-center justify-center"><QrCode className="w-16 h-16" /></div><strong className="text-xs">Kode QRIS Instan</strong><small>Gunakan e-Wallet atau Mobile Banking</small></div>
      <div className="client-payment-panel">
        {ACCOUNTS.map((account) => <div key={account.bank} className="space-y-1.5"><small>Virtual Account {account.bank}:</small><div className="flex items-center justify-between gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <strong className="font-mono text-sm truncate">{account.number}</strong><button type="button" onClick={() => copyAccount(account.bank, account.number)} className="client-copy-action"><Copy className="w-3.5 h-3.5" />{copied === account.bank ? 'Tersalin!' : 'Salin'}</button>
        </div></div>)}
      </div>
    </div>
    <div className="flex flex-col sm:flex-row gap-3">
      <Button type="button" size="lg" onClick={onSuccess} className="client-primary-action flex-1"><CheckCircle2 className="w-4 h-4" /><span>CEK STATUS PEMBAYARAN</span></Button>
      <Button type="button" size="lg" variant="outline" className="client-secondary-action flex-1"><FileCheck2 className="w-4 h-4" /><span>Unduh Bukti Tagihan</span></Button>
    </div>
  </div>;
};
