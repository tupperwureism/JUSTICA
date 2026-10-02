import React from 'react';
import { CheckCircle2, Key, Database, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EscrowTransaction } from '@/types/consultation';

export interface EscrowStatusBannerProps {
  latestTransaction: EscrowTransaction | null;
  downloadedDraftInfo: { title: string; wormHash: string } | null;
}

export const EscrowStatusBanner: React.FC<EscrowStatusBannerProps> = ({
  latestTransaction,
  downloadedDraftInfo,
}) => {
  if (!latestTransaction && !downloadedDraftInfo) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Escrow Status Banner (MOCK-J-CL-03) */}
      {latestTransaction && (
        <Card className="client-banner-escrow border-emerald-500/40 bg-emerald-500/10">
          <div className="client-banner-safe-wrapper">
            <div className="flex items-start gap-3.5 text-xs text-emerald-600 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-foreground text-sm uppercase tracking-wide">
                  Tiket Konsultasi Aktif (Escrow HELD)
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Advokat: <strong className="text-foreground">{latestTransaction.advocateName}</strong> &middot; ID:{' '}
                  <code className="text-emerald-600 dark:text-emerald-400 font-mono">{latestTransaction.id}</code>
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-md border border-emerald-500/25 font-bold">
                    <Key className="w-3 h-3 flex-shrink-0" />
                    <span>Mutex Lock Active (SELECT ... FOR UPDATE)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2.5 py-1 rounded-md border border-blue-500/25 font-bold">
                    <Database className="w-3 h-3 flex-shrink-0" />
                    <span>WORM Audit Logged</span>
                  </span>
                </div>
              </div>
            </div>
            <Badge className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs self-start sm:self-center shadow-md whitespace-nowrap flex-shrink-0 min-h-[36px]">
              Status: ACTIVE_HELD
            </Badge>
          </div>
        </Card>
      )}

      {/* Document Status Banner (MOCK-J-CL-04) */}
      {downloadedDraftInfo && (
        <Card className="client-banner-escrow border-blue-500/40 bg-blue-500/10">
          <div className="client-banner-safe-wrapper">
            <div className="flex items-start gap-3.5 text-xs text-blue-600 dark:text-blue-300 font-medium">
              <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-foreground text-sm uppercase tracking-wide">
                  Draf Dokumen Hukum Terverifikasi &amp; Terkunci WORM
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Dokumen: <strong className="text-foreground">{downloadedDraftInfo.title}</strong>
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono mt-1 break-all">
                  Hash Audit: {downloadedDraftInfo.wormHash}
                </p>
              </div>
            </div>
            <Badge className="px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs self-start sm:self-center shadow-md whitespace-nowrap flex-shrink-0 min-h-[36px]">
              Status: WORM_VERIFIED
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
};
