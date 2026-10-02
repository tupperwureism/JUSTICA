import { useState } from 'react'
import { Gavel, ShieldCheck } from 'lucide-react'
import { Button } from '../../ui/button'
import { DisputeInvestigationTimeline } from './DisputeInvestigationTimeline'
import { DisputeTicketTable } from './DisputeTicketTable'

interface DisputeMonitoringPanelProps {
  onOpenForm: () => void
}

export function DisputeMonitoringPanel({ onOpenForm }: DisputeMonitoringPanelProps) {
  const [recommendationApproved, setRecommendationApproved] = useState(false)

  const approveRefund = () => {
    setRecommendationApproved(true)
    window.alert('Rekomendasi disetujui. Refund Escrow 100% diproses ke rekening Klien.')
  }

  return (
    <section className="dispute-monitoring-shell space-y-5">
      <article className="dispute-card-shell">
        <header className="dispute-card-header">
          <div><p className="text-xs font-bold uppercase tracking-widest text-blue-500">Tiket Sengketa Aktif</p><h2 className="mt-1 text-xl font-black text-foreground">Pemantauan Freeze Escrow</h2></div>
          <Button className="dispute-action dispute-danger-action" onClick={onOpenForm}>Buat Laporan Baru</Button>
        </header>
        <div className="dispute-card-content"><DisputeTicketTable /></div>
      </article>

      <article className="dispute-card-shell">
        <header className="dispute-card-header">
          <div className="flex items-center gap-3"><Gavel className="h-6 w-6 text-blue-500" /><div><h2 className="font-black text-foreground">Log Investigasi Terverifikasi</h2><p className="text-sm text-muted-foreground">Jejak audit WORM Vault tidak dapat diubah.</p></div></div>
        </header>
        <div className="dispute-card-content"><DisputeInvestigationTimeline /></div>
        <footer className="dispute-card-footer block">
          <div className="dispute-recommendation">
            <ShieldCheck className="h-7 w-7 text-emerald-500" />
            <div><span>REKOMENDASI DEWAN KEPATUHAN</span><strong>{recommendationApproved ? 'Refund 100% telah disetujui Klien' : 'Refund Escrow 100% ke Klien'}</strong></div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="outline" className="dispute-action dispute-secondary-action" onClick={() => window.alert('Banding dicatat untuk ditinjau Dewan Etik Justica.')}>Ajukan Banding ke Dewan Etik</Button>
            <Button className="dispute-action dispute-success-action" onClick={approveRefund} disabled={recommendationApproved}>SETUJUI REKOMENDASI & CAIRKAN REFUND 100%</Button>
          </div>
        </footer>
      </article>
    </section>
  )
}
