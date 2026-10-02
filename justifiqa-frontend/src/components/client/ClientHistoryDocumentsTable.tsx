import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HistoryDocument } from '@/types/client';

interface Props { rows: HistoryDocument[]; onDownload?: (id: string) => void }

export const ClientHistoryDocumentsTable: React.FC<Props> = ({ rows, onDownload }) => (
  <div className="overflow-x-auto w-full">
    <table className="w-full text-sm border-collapse min-w-[640px]">
      <thead><tr className="bg-secondary/60 text-left">
        <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">Tanggal</th>
        <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">Advokat</th>
        <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">Layanan & Dokumen</th>
        <th className="px-5 py-3 pr-6 text-right whitespace-nowrap font-bold text-xs uppercase tracking-wider text-muted-foreground">Aksi</th>
      </tr></thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Belum ada riwayat dokumen.</td></tr>}
        {rows.map((row) => <tr key={row.id} className="border-b border-border last:border-b-0">
          <td className="px-5 py-4 text-muted-foreground font-mono text-xs whitespace-nowrap">{row.date}</td>
          <td className="px-5 py-4 font-semibold text-foreground whitespace-nowrap">{row.advocateName}</td>
          <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{row.serviceName}</td>
          <td className="pr-6 text-right whitespace-nowrap font-bold pl-5 py-4"><Button type="button" size="sm" variant="outline" onClick={() => onDownload?.(row.id)} className="client-table-action">
            {row.downloadLabel.toLowerCase().includes('pdf') ? <FileText className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}<span>{row.downloadLabel}</span>
          </Button></td>
        </tr>)}
      </tbody>
    </table>
  </div>
);
