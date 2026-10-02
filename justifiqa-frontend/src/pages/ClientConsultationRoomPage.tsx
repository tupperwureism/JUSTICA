import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConsultationRoomHeader } from '@/components/client/room/ConsultationRoomHeader';
import { ConsultationViewSwitcher, type ConsultationView } from '@/components/client/room/ConsultationViewSwitcher';
import { DeliverableVaultPanel } from '@/components/client/room/DeliverableVaultPanel';
import { EncryptedChatPanel } from '@/components/client/room/EncryptedChatPanel';
import { FairClockGuardrailModal } from '@/components/client/modals/FairClockGuardrailModal';
import { OfflineConsultationQRModal } from '@/components/client/modals/OfflineConsultationQRModal';
import { ReviewRatingModal } from '@/components/client/modals/ReviewRatingModal';
import { PreChatMoUModal } from '../components/common/PreChatMoUModal';
import { DEFAULT_CLIENT_SESSION_ID } from '@/data/clientPortalData';

export function ClientConsultationRoomPage() {
  const navigate = useNavigate();
  const { sessionId = DEFAULT_CLIENT_SESSION_ID } = useParams<{ sessionId: string }>();
  const [hasAcceptedMoU, setHasAcceptedMoU] = useState(false);
  const [activeView, setActiveView] = useState<ConsultationView>('chat');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const [showFairClock, setShowFairClock] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    document.documentElement.classList.toggle('light', themeMode === 'light');
  }, [themeMode]);

  const submitReview = () => {
    window.alert('Ulasan terverifikasi berhasil dikirim. Terima kasih telah menjaga transparansi Justica.');
    navigate('/client/dashboard');
  };

  return (
    <div className="consultation-page-shell">
      <ConsultationRoomHeader
        themeMode={themeMode}
        sessionId={sessionId}
        onBack={() => navigate('/client/dashboard')}
        onPause={() => setShowFairClock(true)}
        onToggleTheme={() => setThemeMode((mode) => mode === 'dark' ? 'light' : 'dark')}
      />
      <main className="consultation-main-shell">
        <ConsultationViewSwitcher activeView={activeView} onChange={setActiveView} />
        {activeView === 'chat' ? (
          <EncryptedChatPanel sessionId={sessionId} onPause={() => setShowFairClock(true)} onOpenVault={() => setActiveView('vault')} onOpenQr={() => setShowQr(true)} />
        ) : (
          <DeliverableVaultPanel sessionId={sessionId} onEscrowReleased={() => setShowReview(true)} />
        )}
      </main>
      {showFairClock && <FairClockGuardrailModal onClose={() => setShowFairClock(false)} />}
      {showQr && <OfflineConsultationQRModal onClose={() => setShowQr(false)} />}
      {showReview && <ReviewRatingModal onClose={() => setShowReview(false)} onSubmit={submitReview} />}
      <PreChatMoUModal
        isOpen={!hasAcceptedMoU}
        onAccept={() => setHasAcceptedMoU(true)}
        onCancel={() => navigate('/client/dashboard')}
        userRole="client"
        partnerName="Dr. Mahendra Kusuma, S.H., M.H."
      />
    </div>
  );
}
