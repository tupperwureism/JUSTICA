import { LockKeyhole } from 'lucide-react';
import type { ChatMessage } from './roomData';

interface ChatTranscriptProps {
  messages: ChatMessage[];
}

export function ChatTranscript({ messages }: ChatTranscriptProps) {
  return (
    <div className="consultation-chat-scroll" aria-live="polite">
      {messages.length === 0 && (
        <p className="m-auto max-w-md text-center text-sm text-muted-foreground">
          Belum ada pesan pada koneksi Realtime ini. Riwayat plaintext tidak disimpan di WORM Vault.
        </p>
      )}
      {messages.map((message) => (
        <article key={message.id} className={`consultation-message ${message.sender}`}>
          <div className="consultation-message-meta">
            <span>{message.author}</span>
            <span className="inline-flex items-center gap-1">
              <LockKeyhole className="size-3" />
              {message.time} • {message.security}
            </span>
          </div>
          <p>{message.content}</p>
        </article>
      ))}
    </div>
  );
}
