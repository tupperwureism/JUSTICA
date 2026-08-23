import { useMemo, useState } from 'react';
import { phase2IntegrationService } from '@/services/phase2SupabaseGateway';
import type { NotaryStampingRequest } from '@/components/corporate/notary/KemenkumhamStampingModal';
import { usePhase2Mutation } from './usePhase2Mutation';
import { usePhase2Query } from './usePhase2Query';

type StampingInput = NotaryStampingRequest & { caseId: string };

export type CddAttempt = {
  caseId: string;
  assessmentId: string;
  rulesVersion: string;
  idempotencyKey: string;
};

export function useNotaryWorkspaceIntegration() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<CddAttempt | null>(null);

  const workspacesQuery = usePhase2Query(
    () => phase2IntegrationService.loadNotaryWorkspaces(),
  );

  const activeWorkspace = useMemo(() => {
    const list = workspacesQuery.data ?? [];
    if (!list.length) return null;
    if (selectedCaseId) {
      return list.find((w) => w.caseId === selectedCaseId) ?? list[0];
    }
    return list[0];
  }, [workspacesQuery.data, selectedCaseId]);

  const selectCase = (caseId: string | null) => {
    setSelectedCaseId(caseId);
    if (currentAttempt && currentAttempt.caseId !== caseId) {
      setCurrentAttempt(null);
    }
  };

  const cddApproval = usePhase2Mutation(
    async (input: { caseId: string; rulesVersion: string; idempotencyKey?: string }) => {
      const assessmentId = activeWorkspace?.cddAssessment?.assessmentId || '';
      const isMatchingAttempt =
        currentAttempt &&
        currentAttempt.caseId === input.caseId &&
        currentAttempt.rulesVersion === input.rulesVersion &&
        (!assessmentId || currentAttempt.assessmentId === assessmentId);

      const attempt: CddAttempt = isMatchingAttempt
        ? currentAttempt!
        : {
            caseId: input.caseId,
            assessmentId,
            rulesVersion: input.rulesVersion,
            idempotencyKey: input.idempotencyKey || crypto.randomUUID(),
          };

      setCurrentAttempt(attempt);

      return phase2IntegrationService.approveNotaryCdd({
        caseId: attempt.caseId,
        rulesVersion: attempt.rulesVersion,
        idempotencyKey: attempt.idempotencyKey,
      });
    },
    {
      onSuccess: async (result) => {
        const refreshedWorkspaces = await workspacesQuery.refresh();
        const verified = refreshedWorkspaces?.find((w) => w.caseId === result.caseId);
        if (
          !verified ||
          verified.currentStage !== 'DOCUMENTS_PENDING' ||
          verified.cddAssessment?.decision !== 'APPROVED' ||
          verified.cddAssessment?.assessmentId !== result.assessmentId
        ) {
          throw new Error('Konfirmasi penyegaran gagal: Status perkara belum terverifikasi DOCUMENTS_PENDING di server.');
        }
        setCurrentAttempt(null);
      },
    },
  );

  const stamping = usePhase2Mutation((input: StampingInput) => (
    phase2IntegrationService.submitNotaryStamping({
      caseId: input.caseId,
      fileName: input.file.name,
      fileType: input.file.type,
      fileSize: input.file.size,
      kemenkumhamNumber: input.kemenkumhamNumber,
      nibNumber: input.nibNumber,
    })
  ));

  return {
    workspaces: workspacesQuery,
    workspace: {
      ...workspacesQuery,
      data: activeWorkspace,
    },
    selectedCaseId: activeWorkspace?.caseId ?? selectedCaseId,
    setSelectedCaseId: selectCase,
    cddApproval,
    stamping,
  };
}
