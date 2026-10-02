import { useEffect, useState } from 'react';
import { ArrowLeft, Moon, Pause, ShieldCheck, Sun, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConsultationRoomHeaderProps {
  themeMode: 'dark' | 'light';
  sessionId: string;
  onBack: () => void;
  onPause: () => void;
  onToggleTheme: () => void;
}

const INITIAL_SECONDS = 44 * 60 + 12;

export function ConsultationRoomHeader({ themeMode, sessionId, onBack, onPause, onToggleTheme }: ConsultationRoomHeaderProps) {
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);

  useEffect(() => {
    const timerId = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <header className="consultation-room-header">
      <div className="consultation-header-inner">
        <Button type="button" variant="outline" onClick={onBack} className="consultation-action consultation-back-action">
          <ArrowLeft />Kembali ke Dasbor
        </Button>
        <div className="consultation-title-group">
          <h1 className="consultation-title">Konsultasi Bersama Dr. Mahendra Kusuma, S.H., M.H.</h1>
          <p className="consultation-subtitle">Sesi #{sessionId.toUpperCase()} • Rekening Bersama #TRX-9901</p>
        </div>
        <div className="consultation-header-actions">
          <Badge variant="outline" className="consultation-security-badge"><ShieldCheck />E2EE Aktif</Badge>
          <Badge variant="outline" className="consultation-clock-badge" aria-live="polite"><Timer />{minutes} Menit {seconds} Detik</Badge>
          <Button type="button" variant="outline" onClick={onPause} className="consultation-action consultation-pause-action"><Pause />MINTA JEDA WAKTU (FAIR-CLOCK)</Button>
          <Button type="button" variant="outline" onClick={onToggleTheme} className="consultation-action consultation-theme-action">
            {themeMode === 'dark' ? <Moon className="size-4 text-blue-400" /> : <Sun className="size-4 text-amber-500" />}
            {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Button>
        </div>
      </div>
    </header>
  );
}
