import { useState, type FormEvent } from 'react'
import { AlertTriangle, FileUp, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { disputeCategories } from './disputeData'

interface DisputeFormModalProps {
  onClose: () => void
  onSubmit: () => void
}

export function DisputeFormModal({ onClose, onSubmit }: DisputeFormModalProps) {
  const [category, setCategory] = useState<(typeof disputeCategories)[number]>(disputeCategories[1])
  const [chronology, setChronology] = useState('')
  const [consented, setConsented] = useState(false)
  const [fileName, setFileName] = useState('Belum ada berkas dipilih')

  const handleFile = (file?: File) => {
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      window.alert('Ukuran berkas bukti maksimal 15MB.')
      return
    }
    setFileName(file.name)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!chronology.trim() || !consented) return
    onSubmit()
  }

  return (
    <div className="settings-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="dispute-form-title">
      <form className="dispute-form-shell dispute-card-shell" onSubmit={handleSubmit}>
        <header className="dispute-card-header">
          <div>
            <span className="dispute-freeze-badge"><AlertTriangle className="h-4 w-4" /> Whistleblowing & Freeze Escrow</span>
            <h2 id="dispute-form-title" className="mt-3 text-xl font-black text-foreground">Laporkan Sengketa Layanan</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Tutup formulir"><X /></Button>
        </header>

        <div className="dispute-card-content">
          <section className="dispute-case-summary">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Perkara Terkait</p>
            <p className="mt-2 font-bold text-foreground">#REQ-202607-001 — Dr. Mahendra Kusuma, S.H. (Tier 2)</p>
            <span className="dispute-freeze-badge mt-3">ESCROW HELD — SIAP DIBEKUKAN (FREEZE)</span>
          </section>

          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-foreground">Kategori Pelanggaran</legend>
            <div className="dispute-radio-grid">
              {disputeCategories.map((item) => (
                <label key={item} className="dispute-radio-option">
                  <input type="radio" name="category" checked={category === item} onChange={() => setCategory(item)} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="space-y-2 text-sm font-bold text-foreground">
            Kronologi Kejadian
            <textarea className="dispute-textarea" value={chronology} onChange={(event) => setChronology(event.target.value)} placeholder="Jelaskan kronologi secara faktual, lengkap, dan berurutan..." required />
          </label>

          <label className="dispute-file-input">
            <FileUp className="h-5 w-5" />
            <span><strong>Unggah bukti PDF/JPG</strong><small>{fileName} · Maksimal 15MB</small></span>
            <input type="file" accept=".pdf,.jpg,.jpeg" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>

          <label className="dispute-consent-row">
            <input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} required />
            <span>Saya menyetujui pembekuan sementara dana Escrow selama proses investigasi.</span>
          </label>
        </div>

        <footer className="dispute-card-footer dispute-form-actions">
          <Button type="button" variant="outline" className="dispute-action dispute-secondary-action" onClick={onClose}>Batal</Button>
          <Button type="submit" className="dispute-action dispute-danger-action">🚨 KIRIM LAPORAN & BEKUKAN ESCROW SEKARANG (CL-09)</Button>
        </footer>
      </form>
    </div>
  )
}
