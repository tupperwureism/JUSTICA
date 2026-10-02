import React from 'react';
import { ClientCatalogFilterBar } from './ClientCatalogFilterBar';
import { ConsultationSection } from '@/components/ConsultationSection';
import type { ConsultationTier } from '@/types/consultation';

export interface ClientCatalogTabProps {
  specialtyFilter: string;
  onSpecialtyChange: (value: string) => void;
  onlineOnly: boolean;
  onOnlineOnlyChange: (checked: boolean) => void;
  onSelectTier: (tier: ConsultationTier) => void;
}

export const ClientCatalogTab: React.FC<ClientCatalogTabProps> = ({
  specialtyFilter,
  onSpecialtyChange,
  onlineOnly,
  onOnlineOnlyChange,
  onSelectTier,
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <ClientCatalogFilterBar
        specialtyFilter={specialtyFilter}
        onSpecialtyChange={onSpecialtyChange}
        onlineOnly={onlineOnly}
        onOnlineOnlyChange={onOnlineOnlyChange}
      />
      <ConsultationSection onSelectTier={onSelectTier} />
    </div>
  );
};
