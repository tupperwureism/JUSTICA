import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { ChatComposer } from './ChatComposer';
import { ChatTranscript } from './ChatTranscript';
import { ConsultationInfoPanel } from './ConsultationInfoPanel';

interface EncryptedChatPanelProps {
  sessionId: string;
  onPause: () => void;
  onOpenVault: () => void;
  onOpenQr: () => void;
}

export function EncryptedChatPanel({ sessionId, onPause, onOpenVault, onOpenQr }: EncryptedChatPanelProps) {
  const [draft, setDraft] = useState('');
  const { messages, status, error, isSending, sendMessage } = useRealtimeChat(sessionId);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    if (await sendMessage(content)) setDraft('');
  };

  return (
    <section>
      <div className="consultation-privileged-banner"><LockKeyhole className="mr-2 inline size-4" />PRIVILEGED AND CONFIDENTIAL — PRIVATE REALTIME CHANNEL (TLS + RLS)</div>
      <div className="consultation-content-grid">
        <Card className="consultation-card-shell">
          <CardHeader className="consultation-card-header"><CardTitle className="consultation-card-title">Ruang Percakapan Privat Realtime</CardTitle><p className="text-xs text-muted-foreground">Status kanal: {status}</p></CardHeader>
          <CardContent className="consultation-card-content"><ChatTranscript messages={messages} /></CardContent>
          <CardFooter className="consultation-card-footer">
            {error && <p role="alert" className="mb-3 text-sm font-semibold text-red-500">{error}</p>}
            <ChatComposer value={draft} onChange={setDraft} onSend={handleSend} disabled={status !== 'connected'} isSending={isSending} />
          </CardFooter>
        </Card>
        <ConsultationInfoPanel onPause={onPause} onOpenVault={onOpenVault} onOpenQr={onOpenQr} />
      </div>
    </section>
  );
}
