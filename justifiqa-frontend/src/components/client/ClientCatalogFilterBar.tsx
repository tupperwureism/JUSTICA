import React from 'react';
import { Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface ClientCatalogFilterBarProps {
  specialtyFilter: string;
  onSpecialtyChange: (value: string) => void;
  onlineOnly: boolean;
  onOnlineOnlyChange: (checked: boolean) => void;
}

export const ClientCatalogFilterBar: React.FC<ClientCatalogFilterBarProps> = ({
  specialtyFilter,
  onSpecialtyChange,
  onlineOnly,
  onOnlineOnlyChange,
}) => {
  return (
    <Card className="p-6 rounded-3xl bg-card border border-border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <span className="text-sm font-bold text-foreground uppercase tracking-wider">
          FILTER DIRECTORY:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <select
          value={specialtyFilter}
          onChange={(e) => onSpecialtyChange(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-secondary border border-border text-xs font-semibold text-foreground focus:outline-none focus:border-primary min-h-[38px]"
        >
          <option value="ALL">Spesialisasi: ^Semua Spesialisasi^</option>
          <option value="BUSINESS">Hukum Bisnis &amp; Sengketa</option>
          <option value="LABOR">Hukum Ketenagakerjaan &amp; PHK</option>
          <option value="CRIMINAL">Pidana &amp; Litigasi Perdata</option>
        </select>

        <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground cursor-pointer select-none min-h-[38px] whitespace-nowrap">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(e) => onOnlineOnlyChange(e.target.checked)}
            className="rounded border-border bg-card text-primary focus:ring-0"
          />
          <span className="font-bold">Advokat Online Saat Ini</span>
        </label>
      </div>
    </Card>
  );
};
