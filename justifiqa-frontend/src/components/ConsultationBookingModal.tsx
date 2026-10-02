import React, { useEffect, useState } from 'react';
import { Lock, X } from 'lucide-react';
import type { ConsultationCheckout, ConsultationTier, LiveConsultationSlot } from '../types/consultation';
import { checkoutConsultation, getAvailableConsultationSlots } from '../services/consultationService';
import { ConsultationBookingForm } from './consultation/ConsultationBookingForm';
import { ConsultationBookingReceipt } from './consultation/ConsultationBookingReceipt';

interface ConsultationBookingModalProps {
  tier: ConsultationTier | null;
  onClose: () => void;
  onBookingSuccess?: (transaction: ConsultationCheckout) => void;
}

export const ConsultationBookingModal: React.FC<ConsultationBookingModalProps> = ({ tier, onClose, onBookingSuccess }) => {
  const [slots, setSlots] = useState<LiveConsultationSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [caseSummary, setCaseSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transaction, setTransaction] = useState<ConsultationCheckout | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    if (!tier) return;
    let active = true;
    setTransaction(null);
    setIsLoadingSlots(true);
    void getAvailableConsultationSlots().then((available) => {
      if (!active) return;
      setSlots(available);
      setSelectedSlotId(available[0]?.id ?? '');
    }).catch((error: unknown) => {
      if (active) setErrorMsg(error instanceof Error ? error.message : 'Gagal mengambil slot konsultasi.');
    }).finally(() => {
      if (active) setIsLoadingSlots(false);
    });
    return () => { active = false; };
  }, [tier]);

  if (!tier) return null;

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    if (!selectedSlotId) return setErrorMsg('Silakan pilih jadwal slot konsultasi advokat terlebih dahulu.');
    if (!caseSummary.trim()) return setErrorMsg('Silakan tuliskan ringkasan singkat permasalahan hukum Anda.');
    setIsProcessing(true);
    try {
      const result = await checkoutConsultation(selectedSlotId, caseSummary);
      setTransaction(result);
      onBookingSuccess?.(result);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Gagal memproses checkout Escrow.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-3xl border-2 border-amber-500/60 shadow-[0_0_60px_rgba(0,0,0,0.95)] rounded-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        <div className="flex items-center justify-between p-6 bg-slate-950/80 border-b border-white/15 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"><Lock className="w-6 h-6" /></div>
            <div><h3 className="font-heading font-extrabold text-xl text-white tracking-tight">Reservasi &amp; Checkout Escrow Mutex</h3><p className="text-xs sm:text-sm text-slate-200 mt-0.5 font-medium">{tier.title} &middot; <span className="text-amber-400 font-bold">{tier.priceLabel}</span></p></div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/15 transition-colors" aria-label="Tutup"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          {transaction ? (
            <ConsultationBookingReceipt transaction={transaction} onClose={onClose} />
          ) : (
            <ConsultationBookingForm slots={slots} selectedSlotId={selectedSlotId} caseSummary={caseSummary} errorMsg={errorMsg} isProcessing={isProcessing} isLoadingSlots={isLoadingSlots} onSelectSlot={setSelectedSlotId} onCaseSummaryChange={setCaseSummary} onSubmit={handleCheckout} />
          )}
        </div>
      </div>
    </div>
  );
};
