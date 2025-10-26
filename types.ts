
export type Mode = 'text' | 'liveChat';
export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark' | 'auto';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
}
