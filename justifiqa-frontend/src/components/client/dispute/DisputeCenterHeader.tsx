import { ArrowLeft, Moon, Plus, Scale, Sun } from 'lucide-react'
import { Button } from '../../ui/button'

interface DisputeCenterHeaderProps {
  themeMode: 'light' | 'dark'
  onBack: () => void
  onOpenForm: () => void
  onToggleTheme: () => void
}

export function DisputeCenterHeader({ themeMode, onBack, onOpenForm, onToggleTheme }: DisputeCenterHeaderProps) {
  const isDark = themeMode === 'dark'
  return (
    <header className="dispute-header-shell">
      <div className="dispute-header-inner">
        <button type="button" className="shared-brand-mark" onClick={onBack}>
          <span className="shared-brand-icon"><Scale className="h-5 w-5" /></span>
          <span><strong>Pusat Sengketa Klien</strong><small>Escrow Protection & Compliance</small></span>
        </button>
        <div className="dispute-header-actions">
          <Button variant="outline" className="dispute-action dispute-secondary-action" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Kembali ke Dasbor</Button>
          <Button variant="outline" className="dispute-action dispute-secondary-action" onClick={onToggleTheme}>
            {isDark ? <Moon className="h-4 w-4 text-blue-400" /> : <Sun className="h-4 w-4 text-amber-500" />}{isDark ? 'Dark Mode' : 'Light Mode'}
          </Button>
          <Button className="dispute-action dispute-danger-action" onClick={onOpenForm}><Plus className="h-4 w-4" /> Laporkan Sengketa</Button>
        </div>
      </div>
    </header>
  )
}
