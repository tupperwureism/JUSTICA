import React from 'react';
import { ClientIracHeader } from './ClientIracHeader';
import { IracSection } from '@/components/IracSection';
import type { IracAnalysis } from '@/types/irac';

export interface ClientIracTabProps {
  onProceedToDraft: (analysis: IracAnalysis) => void;
}

export const ClientIracTab: React.FC<ClientIracTabProps> = ({ onProceedToDraft }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <ClientIracHeader />
      <IracSection onProceedToDraft={onProceedToDraft} />
    </div>
  );
};
