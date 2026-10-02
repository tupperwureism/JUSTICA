import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const ClientIracHeader: React.FC = () => {
  return (
    <Card className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 to-card border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-600 dark:text-purple-300 flex-shrink-0">
          <BrainCircuit className="w-6 h-6 flex-shrink-0" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground uppercase tracking-tight">
            GENERATOR IRAC &amp; PENYUSUNAN DOKUMEN KLIEN
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bedah kronologi hukum mandiri dengan analisis neural 4 pilar sebelum atau selama sesi konsultasi advokat.
          </p>
        </div>
      </div>
    </Card>
  );
};
