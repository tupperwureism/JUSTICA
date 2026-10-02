import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DisputeCenterHeader } from '@/components/client/dispute/DisputeCenterHeader'
import { DisputeFormModal } from '@/components/client/dispute/DisputeFormModal'
import { DisputeMonitoringPanel } from '@/components/client/dispute/DisputeMonitoringPanel'

export function ClientDisputeCenterPage() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
  }, [themeMode])

  const submitDispute = () => {
    setShowForm(false)
    setNotice('Laporan diterima. Escrow #TRX-9901 dibekukan dan jejak audit SHA-256 telah dibuat.')
  }

  return (
    <div className="dispute-page-shell">
      <DisputeCenterHeader
        themeMode={themeMode}
        onBack={() => navigate('/client/dashboard')}
        onOpenForm={() => setShowForm(true)}
        onToggleTheme={() => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'))}
      />
      <main className="dispute-main-shell">
        {notice && <div role="status" className="client-notice-success">{notice}</div>}
        <DisputeMonitoringPanel onOpenForm={() => setShowForm(true)} />
      </main>
      {showForm && <DisputeFormModal onClose={() => setShowForm(false)} onSubmit={submitDispute} />}
    </div>
  )
}
