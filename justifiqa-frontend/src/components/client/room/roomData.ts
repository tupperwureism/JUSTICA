export interface ChatMessage {
  id: string;
  sender: 'advocate' | 'client';
  author: string;
  time: string;
  security: string;
  content: string;
}
