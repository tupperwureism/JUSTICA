export type PresentationReadinessStatus =
  | 'ACCEPTED_LOCAL'
  | 'BLOCKED'
  | 'FUTURE_WORK'
  | 'NOT_STARTED';

export type PresentationDemoTab = 'implemented' | 'roadmap';

export interface PresentationCapability {
  id: string;
  title: string;
  status: PresentationReadinessStatus;
  summary: string;
  evidence: string;
  demoTab?: PresentationDemoTab;
}

export const PRESENTATION_CAPABILITIES: readonly PresentationCapability[] = [
  { id: 'corporate-intake', title: 'Corporate Intake', status: 'ACCEPTED_LOCAL', summary: 'Form, bukti beneficial owner, retry, dan submit server-side tersedia untuk demo lokal.', evidence: 'Batch 3.A / 3.A.1', demoTab: 'implemented' },
  { id: 'corporate-escrow', title: 'Corporate Escrow Settlement', status: 'ACCEPTED_LOCAL', summary: 'Signed webhook settlement, replay idempoten, dan status kanonik tersedia untuk demo lokal.', evidence: 'Batch 3.B / 3.B.1', demoTab: 'implemented' },
  { id: 'provider-initiation', title: 'Payment Provider Initiation', status: 'BLOCKED', summary: 'Checkout provider belum dipilih. UI tidak menampilkan tombol bayar atau URL palsu.', evidence: 'BLOCKED_BY_PROVIDER_SELECTION' },
  { id: 'notary-workspace', title: 'Notary Workspace', status: 'FUTURE_WORK', summary: 'Target assignment, approval, dan transition workspace belum diterima sebagai alur end-to-end.', evidence: 'Roadmap Batch 3.C', demoTab: 'roadmap' },
  { id: 'ekyc-signing', title: 'e-KYC & Signing', status: 'FUTURE_WORK', summary: 'Provider liveness, envelope, callback, dan storage end-to-end masih menjadi pekerjaan berikutnya.', evidence: 'Roadmap Batch 3.D', demoTab: 'roadmap' },
  { id: 'production-readiness', title: 'Production Readiness', status: 'NOT_STARTED', summary: 'Deploy, observability, provider readiness, runbook, dan go-live audit belum dilakukan.', evidence: 'Phase 5' },
] as const;

export const PRESENTATION_STATUS_LABELS: Readonly<Record<PresentationReadinessStatus, string>> = {
  ACCEPTED_LOCAL: 'Accepted local',
  BLOCKED: 'Blocked',
  FUTURE_WORK: 'Future work',
  NOT_STARTED: 'Not started',
};