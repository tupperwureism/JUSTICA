export type ThemeMode = 'dark' | 'light';
export type AuthTab = 'login' | 'register';
export type SyncStatus = 'idle' | 'syncing' | 'verified';

export interface ClientLoginFields { identifier: string; password: string; otp: string; rememberMe: boolean }
export interface ClientRegistrationFields { nik: string; name: string; phone: string; email: string; password: string; confirmPassword: string; agreeTerms: boolean }
export interface AdvocateLoginFields { nia: string; email: string; kmsPassword: string; mfaOtp: string; kmsPin: string; hardwareBoundSession: boolean }
export interface AdvocateRegistrationFields { name: string; email: string; password: string; confirmPassword: string; nik: string; sipp: string; organization: string; bank: string }
