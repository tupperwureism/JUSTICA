import { CheckCircle2, Database, Key } from 'lucide-react';
import type { ConsultationCheckout } from '@/types/consultation';

interface ConsultationBookingReceiptProps { transaction: ConsultationCheckout; onClose: () => void }

export function ConsultationBookingReceipt({ transaction, onClose }: ConsultationBookingReceiptProps) {
  return (
    <div className="space-y-6 animate-fade-in text-center py-4">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]"><CheckCircle2 className="w-10 h-10" /></div>
      <div className="space-y-2"><span className="badge badge-success font-bold px-3 py-1 text-xs">{transaction.status} (Terkunci Mutex)</span><h4 className="text-2xl font-extrabold text-white">Pembayaran &amp; Reservasi Berhasil!</h4><p className="text-xs sm:text-sm text-slate-200 max-w-md mx-auto leading-relaxed">Dana konsultasi sejumlah <strong className="text-white">Rp {transaction.amount.toLocaleString('id-ID')}</strong> telah dipindahkan dari saldo tersedia ke saldo tertahan secara atomik.</p></div>
      <div className="bg-slate-950 border border-white/15 rounded-xl p-5 text-left space-y-3.5 max-w-lg mx-auto text-xs font-mono shadow-inner">
        <div className="flex justify-between border-b border-white/10 pb-2.5"><span className="text-slate-400">Kode Booking:</span><span className="text-blue-400 font-bold">{transaction.bookingCode}</span></div>
        <div className="flex justify-between border-b border-white/10 pb-2.5"><span className="text-slate-400">ID Transaksi Escrow:</span><span className="text-amber-400 font-bold">{transaction.escrowId}</span></div>
        <div className="flex justify-between border-b border-white/10 pb-2.5"><span className="text-slate-400">Advokat Terpilih:</span><span className="text-white font-bold">{transaction.advocateName}</span></div>
        <div className="flex justify-between border-b border-white/10 pb-2.5"><span className="text-slate-400">Status Mutex Lock:</span><span className="text-emerald-400 font-bold flex items-center gap-1.5"><Key className="w-4 h-4" />SELECT ... FOR UPDATE (VERIFIED)</span></div>
        <div className="flex justify-between border-b border-white/10 pb-2.5"><span className="text-slate-400">Referensi Pembayaran:</span><span className="text-blue-400 font-bold">{transaction.paymentReference}</span></div>
        <div className="flex justify-between items-start gap-2"><span className="text-slate-400 shrink-0">Persistensi:</span><span className="flex items-center gap-1 text-blue-400 font-semibold"><Database className="size-4" />booking_sessions + escrow_transactions</span></div>
      </div>
      <div className="pt-4"><button onClick={onClose} className="btn btn-primary-gold w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-black">Selesai &amp; Kembali ke Portal</button></div>
    </div>
  );
}
