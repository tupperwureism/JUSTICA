import { FileText, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ConsultationView = 'chat' | 'vault';

interface ConsultationViewSwitcherProps {
  activeView: ConsultationView;
  onChange: (view: ConsultationView) => void;
}

export function ConsultationViewSwitcher({ activeView, onChange }: ConsultationViewSwitcherProps) {
  return (
    <nav className="consultation-view-switcher" aria-label="Navigasi ruang konsultasi">
      <Button type="button" variant="ghost" onClick={() => onChange('chat')} className={`consultation-action consultation-view-action ${activeView === 'chat' ? 'active' : ''}`}>
        <MessagesSquare />Ruang Obrolan E2EE
      </Button>
      <Button type="button" variant="ghost" onClick={() => onChange('vault')} className={`consultation-action consultation-view-action ${activeView === 'vault' ? 'active' : ''}`}>
        <FileText />Deliverables Vault
      </Button>
    </nav>
  );
}
