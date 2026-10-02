import React from 'react';
import { ClientGreetingCard } from './ClientGreetingCard';
import { ClientOverviewTables } from './ClientOverviewTables';
import type { AuthSession } from '@/types/auth';
import type { ActiveConsultation, HistoryDocument } from '@/types/client';

export interface ClientOverviewTabProps {
  session: AuthSession;
  onNavigateCatalog: () => void;
  onStartProBono: () => void;
  activeConsultations: ActiveConsultation[];
  historyDocuments: HistoryDocument[];
}

export const ClientOverviewTab: React.FC<ClientOverviewTabProps> = ({
  session,
  onNavigateCatalog,
  onStartProBono,
  activeConsultations,
  historyDocuments,
}) => {
  return (
    <div className="space-y-8 animate-fade-in w-full">
      <ClientGreetingCard
        clientName={session.userName}
        onStartCatalogSearch={onNavigateCatalog}
        onStartProBono={onStartProBono}
      />
      <ClientOverviewTables
        activeConsultations={activeConsultations}
        historyDocuments={historyDocuments}
      />
    </div>
  );
};
