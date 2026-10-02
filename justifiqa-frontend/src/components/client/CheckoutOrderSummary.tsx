import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { formatCurrency, getEscrowTotal } from './checkoutPricing';
import type { CheckoutDraft } from '@/types/client';

export const CheckoutOrderSummary: React.FC<{ draft: CheckoutDraft }> = ({ draft }) => (
  <>
    <div className="rounded-2xl border border-border bg-secondary/40 p-5 space-y-2.5">
      <div className="client-summary-row"><span>Advokat Mitra</span><strong>{draft.advocate.name}</strong></div>
      <div className="client-summary-row"><span>Layanan Dipilih</span><strong>{draft.service.label} ({draft.service.duration})</strong></div>
      <div className="client-summary-row"><span>Jadwal Pertemuan</span><strong>{draft.date} — {draft.time}</strong></div>
      <div className="client-summary-row"><span>Biaya Konsultasi Dasar</span><strong>{formatCurrency(draft.service.price)}</strong></div>
      <div className="client-summary-row"><span>Perlindungan Escrow & PPN (11%)</span><strong>{formatCurrency(Math.round(draft.service.price * 0.11))}</strong></div>
      <div className="client-summary-row pt-2 border-t border-border"><span>Total Pembayaran Escrow</span><strong className="text-lg text-primary">{formatCurrency(getEscrowTotal(draft.service.price))}</strong></div>
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Dana dilindungi Rekening Bersama (Escrow) dan baru diteruskan setelah sesi selesai.</p>
  </>
);
