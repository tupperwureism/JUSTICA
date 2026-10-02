import { useState } from 'react';
import { LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrivacySettingsPanel } from './settings/PrivacySettingsPanel';
import { SecuritySettingsPanel } from './settings/SecuritySettingsPanel';

interface AccountSettingsTabProps { onClose: () => void }
type SettingsPane = 'security' | 'privacy';

export function AccountSettingsTab({ onClose }: AccountSettingsTabProps) {
  const [activePane, setActivePane] = useState<SettingsPane>('security');
  return (
    <div className="client-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="client-modal-shell settings-modal-shell">
        <header className="client-modal-header">
          <div><h2 id="settings-title" className="font-heading text-lg font-extrabold">Pengaturan Identitas, MFA, &amp; Privasi UU PDP</h2><p className="mt-1 text-xs text-muted-foreground">Kelola kredensial serta kontrol data pribadi Anda.</p></div>
          <button type="button" onClick={onClose} className="client-modal-close" aria-label="Tutup"><X /></button>
        </header>
        <div className="max-h-[78vh] overflow-y-auto p-5 sm:p-8">
          <nav className="settings-tabs mb-7">
            <Button type="button" variant="ghost" onClick={() => setActivePane('security')} className={`settings-tab-action ${activePane === 'security' ? 'active' : ''}`}><LockKeyhole />Keamanan &amp; MFA</Button>
            <Button type="button" variant="ghost" onClick={() => setActivePane('privacy')} className={`settings-tab-action ${activePane === 'privacy' ? 'active' : ''}`}><ShieldCheck />Privasi UU PDP</Button>
          </nav>
          {activePane === 'security' ? <SecuritySettingsPanel /> : <PrivacySettingsPanel />}
        </div>
      </div>
    </div>
  );
}
