import React from 'react';
import { ArrowRight, CheckCircle2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CheckoutDraft } from '@/types/client';

interface Props { draft: CheckoutDraft; receiptHash: string; proBono: boolean; onEnter: () => void }

export const CheckoutSuccessReceipt: React.FC<Props> = ({ draft, receiptHash, proBono, onEnter }) => (
  <div className="space-y-6 text-center">
    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-500 mx-auto"><CheckCircle2 className="w-8 h-8" /></div>
    <div className="space-y-1.5"><h3 className="text-lg font-extrabold text-foreground font-heading">{proBono ? 'Pro Bono SKTM Disetujui (Rp 0)' : 'Pembayaran Diterima'}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">Jadwal bersama {draft.advocate.name} pada {draft.date} — {draft.time} telah dikonfirmasi secara kriptografis.</p></div>
    <div className="rounded-2xl border border-border bg-secondary/40 p-4 flex items-center justify-center gap-2 text-[11px] font-mono text-muted-foreground"><Hash className="w-3.5 h-3.5 text-primary" /><span className="truncate">{receiptHash}</span></div>
    <Button type="button" size="lg" onClick={onEnter} className="client-primary-action w-full bg-emerald-600 hover:bg-emerald-700"><span>MASUK KE RUANG {proBono ? 'PRO BONO' : 'KONSULTASI'} SEKARANG</span><ArrowRight className="w-4 h-4" /></Button>
  </div>
);
