export type UserRole = 'CLIENT' | 'ADVOCATE' | 'AI_ASSISTANT';

export interface AuthSession {
  role: UserRole;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  walletBalance: number;
  verifiedAdvocateId?: string;
}

export const DEFAULT_SESSIONS: Record<UserRole, AuthSession> = {
  CLIENT: {
    role: 'CLIENT',
    userName: 'Budi Santoso (Klien)',
    userEmail: 'budi.client@justifiqa.id',
    walletBalance: 2500000,
  },
  ADVOCATE: {
    role: 'ADVOCATE',
    userName: 'Dr. Hendra Wijaya, S.H., M.H.',
    userEmail: 'hendra.advocate@justifiqa.id',
    walletBalance: 14500000,
    verifiedAdvocateId: 'ADV-PERADI-2026-9912',
  },
  AI_ASSISTANT: {
    role: 'AI_ASSISTANT',
    userName: 'Justifiqa Legal AI Engine (v2.4)',
    userEmail: 'ai.core@justifiqa.id',
    walletBalance: 0,
  },
};
