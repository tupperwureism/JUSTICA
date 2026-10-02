import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { MockIracService } from '@/services/mockIracService';
import type { AuthSession } from '@/types/auth';
import type { IracAnalysis, LegalDocumentDraft, LegalDocumentTemplateId } from '@/types/irac';

export function useDocumentDrafting(analysis: IracAnalysis | null, session: AuthSession, onDownloaded?: (draft: LegalDocumentDraft, hash: string) => void) {
  const [selectedTemplate, setSelectedTemplate] = useState<LegalDocumentTemplateId>('SOMASI_TERBUKA');
  const [opponentName, setOpponentName] = useState('PT Mitra Tergugat Nusantara');
  const [advocateName, setAdvocateName] = useState('Dr. Hendra Wijaya, S.H., M.H. & Rekan');
  const [draft, setDraft] = useState<LegalDocumentDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccessHash, setDownloadSuccessHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const generate = useCallback(async () => {
    if (!analysis) return;
    setErrorMsg('');
    setIsGenerating(true);
    try {
      setDraft(await MockIracService.generateDocumentDraft(selectedTemplate, analysis, session.userName, advocateName, opponentName));
    } catch {
      setErrorMsg('Gagal merakit draf dokumen hukum. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  }, [advocateName, analysis, opponentName, selectedTemplate, session.userName]);
  useEffect(() => { void generate(); }, [generate]);
  const refresh = (event: FormEvent) => { event.preventDefault(); void generate(); };
  const download = async () => {
    if (!draft) return;
    setIsDownloading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    const hash = `WORM-DOC-SHA256-${Math.random().toString(36).substring(2, 16).toUpperCase()}`;
    setDownloadSuccessHash(hash);
    setIsDownloading(false);
    onDownloaded?.(draft, hash);
  };
  return { selectedTemplate, setSelectedTemplate, opponentName, setOpponentName, advocateName, setAdvocateName, draft, isGenerating, isDownloading, downloadSuccessHash, errorMsg, refresh, download };
}
