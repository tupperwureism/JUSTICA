import React from 'react';
import { MessageSquare, Radio, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ActiveConsultation } from '@/types/client';

interface Props { rows: ActiveConsultation[]; onOpen?: (id: string) => void }

export const ClientActiveConsultationsTable: React.FC<Props> = ({ rows, onOpen }) => (
  <div className="overflow-x-auto w-full">
    <table className="w-full text-sm border-collapse min-w-[640px]">
      <thead><tr className="bg-secondary/60 text-left">
        <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">Advokat Mitra</th>
        <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">Spesialisasi</th>
        <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">Status Layanan</th>
        <th className="px-5 py-3 pr-6 text-right whitespace-nowrap font-bold text-xs uppercase tracking-wider text-muted-foreground">Aksi</th>
      </tr></thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Belum ada konsultasi aktif saat ini.</td></tr>}
        {rows.map((row) => <tr key={row.id} className="border-b border-border last:border-b-0">
          <td className="px-5 py-4 font-semibold text-foreground whitespace-nowrap">{row.advocateName}</td>
          <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{row.specialty}</td>
          <td className="px-5 py-4 whitespace-nowrap"><Badge variant="outline" className={row.statusVariant === 'live' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500' : 'border-amber-500/40 bg-amber-500/10 text-amber-500'}>
            {row.statusVariant === 'live' ? <Radio className="w-3 h-3" /> : <Loader2 className="w-3 h-3" />}<span>{row.status}</span>
          </Badge></td>
          <td className="pr-6 text-right whitespace-nowrap font-bold pl-5 py-4"><Button type="button" size="sm" onClick={() => onOpen?.(row.id)} className="client-table-action">
            <MessageSquare className="w-3.5 h-3.5" /><span>{row.actionLabel}</span>
          </Button></td>
        </tr>)}
      </tbody>
    </table>
  </div>
);
