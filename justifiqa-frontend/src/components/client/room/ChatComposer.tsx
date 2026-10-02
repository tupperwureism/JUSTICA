import type { FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => Promise<void>;
  disabled: boolean;
  isSending: boolean;
}

export function ChatComposer({ value, onChange, onSend, disabled, isSending }: ChatComposerProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSend();
  };

  return (
    <form className="consultation-chat-input-row" onSubmit={handleSubmit}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ketik pesan konsultasi Anda di sini..."
        className="consultation-chat-input"
        disabled={disabled || isSending}
      />
      <Button type="submit" disabled={disabled || isSending || !value.trim()} className="consultation-action consultation-send-action">
        <Send className="size-4" />
        {isSending ? 'MENGIRIM...' : 'KIRIM PESAN'}
      </Button>
    </form>
  );
}
