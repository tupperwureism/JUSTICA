import React from 'react';
import { FileText, X } from 'lucide-react';
import { DocumentDraftActions } from './document/DocumentDraftActions';
import { DocumentDraftPreview } from './document/DocumentDraftPreview';
import { DocumentDraftingForm } from './document/DocumentDraftingForm';
import { MultiPartySigningPanel } from './signing/MultiPartySigningPanel';
import { useDocumentDrafting } from '@/hooks/useDocumentDrafting';
import type { AuthSession } from '../types/auth';
import type { IracAnalysis, LegalDocumentDraft } from '../types/irac';

interface DocumentDraftingModalProps {
  analysis: IracAnalysis | null;
  session: AuthSession;
  onClose: () => void;
  onDraftDownloaded?: (draft: LegalDocumentDraft, wormHash: string) => void;
}

export const DocumentDraftingModal: React.FC<DocumentDraftingModalProps> = ({ analysis, session, onClose, onDraftDownloaded }) => {
  const drafting = useDocumentDrafting(analysis, session, onDraftDownloaded);
  if (!analysis) return null;
  return (
    <div className="document-drafting-overlay animate-fade-in">
      <div className="document-drafting-shell">
        <div className="document-drafting-header">
          <div className="flex items-center gap-3">
            <div className="document-drafting-icon"><FileText className="w-6 h-6" /></div>
            <div><h3 className="font-heading font-extrabold text-xl text-foreground tracking-tight">Perakitan Draf Dokumen Hukum (Document Builder Engine)</h3><p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">Rujukan IRAC: <strong className="text-primary">{analysis.caseTitle}</strong> · ID: {analysis.id}</p></div>
          </div>
          <button type="button" onClick={onClose} className="client-modal-close" aria-label="Tutup"><X className="w-5 h-5" /></button>
        </div>
        <div className="py-6 overflow-y-auto flex-grow space-y-6 pr-1">
          <DocumentDraftingForm selectedTemplate={drafting.selectedTemplate} setSelectedTemplate={drafting.setSelectedTemplate} opponentName={drafting.opponentName} setOpponentName={drafting.setOpponentName} advocateName={drafting.advocateName} setAdvocateName={drafting.setAdvocateName} isGenerating={drafting.isGenerating} errorMsg={drafting.errorMsg} onSubmit={drafting.refresh} />
          <DocumentDraftPreview draft={drafting.draft} isGenerating={drafting.isGenerating} />
          {drafting.draft && (
            <MultiPartySigningPanel
              key={drafting.draft.id}
              documentTitle={drafting.draft.title}
              userRole={session.role === 'ADVOCATE' ? 'advocate' : 'client'}
              parties={[
                { id: 'client', name: drafting.draft.clientName, role: 'CLIENT', status: 'PENDING' },
                { id: 'advocate', name: drafting.draft.advocateName, role: 'ADVOCATE', status: 'PENDING' },
              ]}
            />
          )}
          <DocumentDraftActions draft={drafting.draft} isDownloading={drafting.isDownloading} successHash={drafting.downloadSuccessHash} onDownload={drafting.download} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};
