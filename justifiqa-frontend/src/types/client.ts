// src/types/client.ts
// Kontrak tipe data bersama untuk Client Portal Batch 2 (Dashboard, Catalog, Checkout Escrow)

export type ClientTabKey = 'dashboard' | 'catalog' | 'j_biz';

export interface ActiveConsultation {
  id: string;
  advocateName: string;
  specialty: string;
  status: string;
  statusVariant: 'live' | 'processing';
  actionLabel: string;
}

export interface HistoryDocument {
  id: string;
  date: string;
  advocateName: string;
  serviceName: string;
  downloadLabel: string;
}

export interface ServiceOption {
  id: string;
  label: string;
  duration: string;
  price: number;
  priceLabel: string;
  description: string;
}

export interface Advocate {
  id: string;
  slug: string;
  name: string;
  license: string;
  licenseBody: 'PERADI' | 'AAI';
  rating: number;
  reviewCount: number;
  specialty: string;
  experienceYears: number;
  isOnline: boolean;
  hasProBonoQuota: boolean;
  avatarInitials: string;
  bio: string;
  services: ServiceOption[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface CheckoutDraft {
  advocate: Advocate;
  service: ServiceOption;
  meetingMethod: 'online' | 'offline';
  date: string;
  time: string;
}
