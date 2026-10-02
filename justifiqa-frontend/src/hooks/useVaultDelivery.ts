import { useCallback, useEffect, useState } from 'react';
import { createVaultDownloadUrl, getVaultDocument, releaseVaultEscrow, type VaultDocument } from '@/services/vaultDeliveryService';

export function useVaultDelivery(sessionReference: string) {
  const [document, setDocument] = useState<VaultDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReleasing, setIsReleasing] = useState(false);
  const [released, setReleased] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void getVaultDocument(sessionReference).then((result) => {
      if (active) setDocument(result);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Dokumen WORM gagal dimuat.');
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [sessionReference]);

  const download = useCallback(async () => {
    if (!document) return;
    setError('');
    try {
      const signedUrl = await createVaultDownloadUrl(document.storagePath);
      const link = window.document.createElement('a');
      link.href = signedUrl;
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unduhan WORM gagal disiapkan.');
    }
  }, [document]);

  const release = useCallback(async (): Promise<boolean> => {
    if (released || !document) return released;
    setIsReleasing(true);
    setError('');
    try {
      await releaseVaultEscrow(sessionReference);
      setReleased(true);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Escrow gagal dilepaskan.');
      return false;
    } finally {
      setIsReleasing(false);
    }
  }, [document, released, sessionReference]);

  return { document, isLoading, isReleasing, released, error, download, release };
}
