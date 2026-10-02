import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { resolveRoomSession } from '@/services/roomSessionService';
import type { ChatMessage } from '@/components/client/room/roomData';

export type RealtimeChatStatus = 'connecting' | 'connected' | 'error';

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (typeof value !== 'object' || value === null) return false;
  return 'id' in value && typeof value.id === 'string'
    && 'sender' in value && (value.sender === 'client' || value.sender === 'advocate')
    && 'author' in value && typeof value.author === 'string'
    && 'time' in value && typeof value.time === 'string'
    && 'security' in value && typeof value.security === 'string'
    && 'content' in value && typeof value.content === 'string';
};

export function useRealtimeChat(sessionReference: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<RealtimeChatStatus>('connecting');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let active = true;
    void resolveRoomSession(sessionReference).then(async ({ bookingId }) => {
      await supabase.realtime.setAuth();
      if (!active) return;
      const channel = supabase.channel(`consultation:${bookingId}:messages`, {
        config: { private: true, broadcast: { ack: true, self: true } },
      });
      channel.on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        if (active && isChatMessage(payload)) setMessages((current) => [...current, payload]);
      });
      channel.subscribe((nextStatus) => {
        if (!active) return;
        if (nextStatus === 'SUBSCRIBED') setStatus('connected');
        if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') {
          setStatus('error');
          setError('Kanal privat Realtime gagal tersambung. Silakan muat ulang ruang konsultasi.');
        }
      });
      channelRef.current = channel;
    }).catch((reason: unknown) => {
      if (!active) return;
      setStatus('error');
      setError(reason instanceof Error ? reason.message : 'Sesi Realtime gagal disiapkan.');
    });
    return () => {
      active = false;
      const channel = channelRef.current;
      channelRef.current = null;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [sessionReference]);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    const channel = channelRef.current;
    if (!channel || status !== 'connected') {
      setError('Pesan belum dapat dikirim karena kanal privat belum tersambung.');
      return false;
    }
    setIsSending(true);
    setError('');
    const { data: sessionData } = await supabase.auth.getSession();
    const metadataName: unknown = sessionData.session?.user.user_metadata.full_name;
    const author = typeof metadataName === 'string' && metadataName.trim() ? metadataName : 'Klien Justica';
    const message: ChatMessage = { id: crypto.randomUUID(), sender: 'client', author: `${author} (Anda)`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      security: 'Private Realtime • TLS', content };
    const response = await channel.send({ type: 'broadcast', event: 'chat-message', payload: message });
    setIsSending(false);
    if (response === 'ok') return true;
    setError('Pesan gagal diterima kanal Realtime. Silakan kirim ulang.');
    return false;
  }, [status]);

  return { messages, status, error, isSending, sendMessage };
}
