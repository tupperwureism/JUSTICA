// src/components/client/ClientOverviewTables.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ClientActiveConsultationsTable } from './ClientActiveConsultationsTable';
import { ClientHistoryDocumentsTable } from './ClientHistoryDocumentsTable';
import type { ActiveConsultation, HistoryDocument } from '@/types/client';

interface ClientOverviewTablesProps {
  activeConsultations: ActiveConsultation[];
  historyDocuments: HistoryDocument[];
  onOpenConsultation?: (id: string) => void;
  onDownloadDocument?: (id: string) => void;
}

export const ClientOverviewTables: React.FC<ClientOverviewTablesProps> = ({
  activeConsultations,
  historyDocuments,
  onOpenConsultation,
  onDownloadDocument,
}) => {
  return (
    <div className="w-full flex flex-col gap-8">
      {/* KONSULTASI HUKUM AKTIF — SATU Card, tidak berlapis */}
      <Card className="flex flex-col gap-5 p-6 sm:p-7 rounded-2xl border border-border bg-card shadow-md">
        <CardHeader className="p-0 gap-1.5">
          <CardTitle className="text-lg sm:text-xl font-extrabold font-heading text-foreground">
            Konsultasi Hukum Aktif
          </CardTitle>
          <p className="text-xs text-muted-foreground">Sesi yang sedang berjalan dan membutuhkan tindakan Anda.</p>
        </CardHeader>
        <CardContent className="p-0">
          <ClientActiveConsultationsTable rows={activeConsultations} onOpen={onOpenConsultation} />
        </CardContent>
      </Card>

      {/* RIWAYAT DOKUMEN & KONSULTASI SELESAI — SATU Card, tidak berlapis */}
      <Card className="flex flex-col gap-5 p-6 sm:p-7 rounded-2xl border border-border bg-card shadow-md">
        <CardHeader className="p-0 gap-1.5">
          <CardTitle className="text-lg sm:text-xl font-extrabold font-heading text-foreground">
            Riwayat Dokumen & Konsultasi Selesai
          </CardTitle>
          <p className="text-xs text-muted-foreground">Arsip WORM Vault — tersimpan aman dan dapat diunduh kapan saja.</p>
        </CardHeader>
        <CardContent className="p-0">
          <ClientHistoryDocumentsTable rows={historyDocuments} onDownload={onDownloadDocument} />
        </CardContent>
      </Card>
    </div>
  );
};
