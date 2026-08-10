import { useCallback } from 'react';
import type { BeneficialOwnerDraft } from '@/models/corporateIntake';
import {
  useCorporateEvidenceUploads,
  type CorporateEvidenceAdapter,
} from './useCorporateEvidenceUploads.ts';

type OwnersUpdater = (owners: BeneficialOwnerDraft[]) => BeneficialOwnerDraft[];

export function useBeneficialOwnerEvidence({
  adapter,
  onChange,
  createId,
}: {
  adapter: CorporateEvidenceAdapter;
  onChange: (update: OwnersUpdater) => void;
  createId?: () => string;
}) {
  const updateOwner = useCallback((
    clientRowId: string,
    patch: Partial<BeneficialOwnerDraft>,
  ) => {
    onChange((current) => current.map((owner) => (
      owner.clientRowId === clientRowId ? { ...owner, ...patch } : owner
    )));
  }, [onChange]);

  const uploads = useCorporateEvidenceUploads(adapter, {
    createId,
    onFinalized: (clientRowId, evidenceReference) => {
      updateOwner(clientRowId, { evidenceReference });
    },
  });

  const startFile = useCallback((clientRowId: string, file: File) => {
    updateOwner(clientRowId, { evidenceReference: undefined });
    return uploads.start(clientRowId, file);
  }, [updateOwner, uploads]);

  return {
    ...uploads,
    updateOwner,
    startFile,
  };
}
