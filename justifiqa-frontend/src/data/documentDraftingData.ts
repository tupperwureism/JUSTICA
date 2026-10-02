import type { LegalDocumentTemplateId } from '@/types/irac';

export const DOCUMENT_TEMPLATES: { id: LegalDocumentTemplateId; label: string; desc: string }[] = [
  { id: 'SOMASI_TERBUKA', label: 'Surat Somasi Terbuka & Peringatan Hukum', desc: 'Peringatan keras dengan ultimatum waktu (7 hari) sebelum gugatan hukum diajukan.' },
  { id: 'PERJANJIAN_DAMAI', label: 'Perjanjian Kesepakatan Damai (Dading)', desc: 'Akta penyelesaian sengketa di luar pengadilan dengan pelepasan tuntutan (Release & Discharge).' },
  { id: 'GUGATAN_SEDERHANA', label: 'Draf Gugatan Wanprestasi / PMH', desc: 'Draf surat gugatan formal (Posita & Petitum) siap daftarkan ke Pengadilan Negeri.' },
];
