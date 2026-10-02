import type { FormEvent } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AdvocateE2EEChatPanelProps {
  chatMessages: Array<{ time: string; sender: string; text: string }>;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: (event: FormEvent) => void;
  onGoToDeliverable: () => void;
  onEndSession: () => void;
}

export function AdvocateE2EEChatPanel(props: AdvocateE2EEChatPanelProps) {
  return (
    <Card className="space-y-4 rounded-3xl border-border bg-card/90 p-6 shadow-2xl">
      <div className="h-72 space-y-3 overflow-y-auto rounded-2xl border border-border/50 bg-secondary/30 p-4">
        {props.chatMessages.map((message, index) => (
          <article key={`${message.time}-${index}`} className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="font-mono text-emerald-500">[{message.time}]</span><strong className="text-foreground">{message.sender}:</strong></div>
            <p className="rounded-xl border border-border/50 bg-secondary/60 p-2.5 text-sm text-foreground sm:pl-14">{message.text}</p>
          </article>
        ))}
      </div>
      <form onSubmit={props.onSendMessage} className="flex flex-col items-stretch gap-3 sm:flex-row">
        <Input value={props.newMessage} onChange={(event) => props.onNewMessageChange(event.target.value)} placeholder="Ketik analisis atau balasan hukum ber-enkripsi E2EE untuk Klien..." className="h-12 flex-1 rounded-xl border-border bg-secondary/40" />
        <Button type="submit" className="min-h-12 whitespace-nowrap rounded-xl bg-emerald-600 px-6 font-bold text-white hover:bg-emerald-700">Kirim Pesan E2EE</Button>
      </form>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Button type="button" onClick={props.onGoToDeliverable} className="min-h-10 whitespace-nowrap rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"><FileText />BUAT DOKUMEN DELIVERABLE</Button>
        <Button type="button" variant="destructive" onClick={props.onEndSession} className="min-h-10 whitespace-nowrap rounded-xl font-bold">Akhiri Sesi Konsultasi</Button>
      </footer>
    </Card>
  );
}
