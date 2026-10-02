import type { FormEvent } from 'react';
import { AlertCircle, Clock, Database, Loader2, Lock, ShieldCheck, Star } from 'lucide-react';
import type { LiveConsultationSlot } from '@/types/consultation';

interface ConsultationBookingFormProps {
  slots: LiveConsultationSlot[];
  selectedSlotId: string;
  caseSummary: string;
  errorMsg: string;
  isProcessing: boolean;
  isLoadingSlots: boolean;
  onSelectSlot: (id: string) => void;
  onCaseSummaryChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function ConsultationBookingForm(props: ConsultationBookingFormProps) {
  const selectedSlot = props.slots.find((slot) => slot.id === props.selectedSlotId);
  return (
    <form onSubmit={props.onSubmit} className="space-y-6">
      {props.errorMsg && <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center gap-2.5 text-xs sm:text-sm text-red-200 font-semibold"><AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />{props.errorMsg}</div>}
      <div className="space-y-3">
        <label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-300 block">1. Pilih Jadwal &amp; Advokat Spesialis:</label>
        <div className="grid grid-cols-1 gap-3">
          {props.isLoadingSlots && <p className="rounded-xl border border-white/15 bg-slate-800/80 p-4 text-sm text-slate-300">Memuat slot PostgreSQL yang masih tersedia...</p>}
          {!props.isLoadingSlots && props.slots.length === 0 && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">Belum ada slot konsultasi mendatang yang tersedia.</p>}
          {props.slots.map((slot) => (
            <button key={slot.id} type="button" onClick={() => props.onSelectSlot(slot.id)} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-4 text-left ${props.selectedSlotId === slot.id ? 'bg-amber-500/20 border-amber-400 text-white shadow-md ring-1 ring-amber-400' : 'bg-slate-800/80 border-white/15 text-slate-200 hover:border-white/30 hover:bg-slate-800'}`}>
              <div className="space-y-1"><div className="flex items-center gap-2.5"><span className="font-bold text-sm sm:text-base text-white">{slot.advocateName}</span><span className="flex items-center gap-1 text-xs text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30"><Star className="w-3.5 h-3.5 fill-amber-400" />{slot.advocateRating}</span></div><p className="text-xs sm:text-sm text-slate-300 font-medium">{slot.advocateTitle}</p><p className="text-xs text-blue-300 font-bold flex items-center gap-1.5 mt-1.5"><Clock className="w-3.5 h-3.5" />{slot.slotTimeLabel} · {slot.specialty}</p></div>
              <div className="flex shrink-0 items-center gap-3"><span className="text-xs font-bold text-amber-300">{slot.priceLabel}</span><span className="w-6 h-6 rounded-full border-2 border-white/40 flex items-center justify-center flex-shrink-0">{props.selectedSlotId === slot.id && <span className="w-3 h-3 rounded-full bg-amber-400" />}</span></div>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2.5"><label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-300 block">2. Ringkasan Fakta Permasalahan Hukum (Story of Facts):</label><textarea rows={3} value={props.caseSummary} onChange={(event) => props.onCaseSummaryChange(event.target.value)} placeholder="Contoh: Perusahaan mitra melanggar klausul pembayaran kontrak proyek konstruksi senilai Rp 800 Juta yang seharusnya jatuh tempo bulan lalu..." className="w-full rounded-xl bg-slate-950 border border-white/20 p-4 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 resize-none font-medium leading-relaxed" /></div>
      <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-xl p-4.5 space-y-3 text-xs sm:text-sm text-slate-200 shadow-inner">
        <div className="flex items-center justify-between text-white font-bold border-b border-white/10 pb-2.5"><span>Rincian Pembayaran PostgreSQL:</span><span className="text-amber-400 font-extrabold text-base">{selectedSlot?.priceLabel ?? 'Pilih slot'}</span></div>
        {selectedSlot && <div className="flex items-center justify-between text-xs text-blue-300 font-semibold"><span>Advokat Terpilih:</span><span className="text-white font-bold">{selectedSlot.advocateName}</span></div>}
        <div className="space-y-2 text-xs text-slate-300 font-medium"><div className="flex items-center gap-2.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /><span>Dana dikunci dengan <strong className="text-white">ACID Mutex Lock (`HELD_IN_ESCROW`)</strong>.</span></div><div className="flex items-center gap-2.5"><Database className="w-4 h-4 text-blue-400" /><span>Booking dan Escrow dicatat atomik pada <strong className="text-white">PostgreSQL</strong>.</span></div></div>
      </div>
      <button type="submit" disabled={props.isProcessing || props.isLoadingSlots || !selectedSlot} className="w-full btn btn-primary-gold py-4 rounded-xl shadow-lg text-base font-extrabold text-black flex items-center justify-center gap-2.5">{props.isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Memproses Penguncian Escrow Mutex...</> : <><Lock className="w-5 h-5" />Bayar Rp {(selectedSlot?.price ?? 0).toLocaleString('id-ID')} &amp; Kunci Jadwal</>}</button>
    </form>
  );
}
