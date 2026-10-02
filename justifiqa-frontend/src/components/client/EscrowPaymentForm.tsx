import React, { useState } from 'react';
import { ArrowRight, CreditCard, Landmark, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from './checkoutPricing';

type PaymentMethod = 'qris' | 'va' | 'card';
const METHODS = [
  { key: 'qris', label: 'QRIS', desc: 'Gopay, OVO, DANA, m-Banking', icon: QrCode },
  { key: 'va', label: 'Virtual Account', desc: 'BCA, Mandiri, BNI, BRI', icon: Landmark },
  { key: 'card', label: 'Kartu Kredit/Debit', desc: 'Visa, Mastercard', icon: CreditCard },
] as const;

export const EscrowPaymentForm: React.FC<{ price: number; onPay: () => void }> = ({ price, onPay }) => {
  const [method, setMethod] = useState<PaymentMethod>('qris');
  const [agreed, setAgreed] = useState(false);
  return <div className="space-y-4">
    <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Pilih Metode Pembayaran</p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {METHODS.map(({ key, label, desc, icon: Icon }) => <button key={key} type="button" onClick={() => setMethod(key)} className={`client-payment-method ${method === key ? 'active' : ''}`}>
        <Icon className="w-5 h-5" /><span><strong>{label}</strong><small>{desc}</small></span>
      </button>)}
    </div>
    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground select-none"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="w-4 h-4 mt-0.5" /><span>Saya menyetujui Ketentuan Layanan Justica dan mekanisme Escrow.</span></label>
    <Button type="button" size="lg" disabled={!agreed} onClick={onPay} className="client-primary-action w-full disabled:opacity-50"><span>BAYAR SEKARANG — {formatCurrency(price)}</span><ArrowRight className="w-4 h-4" /></Button>
  </div>;
};
