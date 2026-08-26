import { useEffect, useMemo, useState } from 'react';
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

/**
 * Narrow injection seam for behavioral tests (Batch 3.C.5).
 * Production callers keep calling useNotaryWorkspaceIntegration() with no
 * argument and receive the real phase2IntegrationService. Tests may inject
 * only the methods this hook actually uses; no hook logic is duplicated and
 * no privileged browser access is exposed.
 */
export type NotaryWorkspaceService = Pick<
  typeof phase2IntegrationService,
  'loadNotaryWorkspaces' | 'approveNotaryCdd' | 'submitNotaryStamping'
>;

export function useNotaryWorkspaceIntegration(
  service: NotaryWorkspaceService = phase2IntegrationService,
) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<CddAttempt | null>(null);

  const workspacesQuery = usePhase2Query(
    () => service.loadNotaryWorkspaces(),
  );

  const activeWorkspace = useMemo(() => {
    const list = workspacesQuery.data ?? [];
    if (!list.length) return null;
    if (selectedCaseId) {
      return list.find((w) => w.caseId === selectedCaseId) ?? null;
    }
    return list[0];
  }, [workspacesQuery.data, selectedCaseId]);

  const cddApproval = usePhase2Mutation(
    async (input: { caseId: string; rulesVersion: string; idempotencyKey?: string }) => {
      const assessmentId = activeWorkspace?.cddAssessment?.assessmentId;
      if (!activeWorkspace || activeWorkspace.caseId !== input.caseId || !assessmentId) {
        throw new Error('Case atau CDD Assessment tidak ditemukan.');
      }
      const isMatchingAttempt =
        currentAttempt &&
        currentAttempt.caseId === input.caseId &&
        currentAttempt.rulesVersion === input.rulesVersion &&
        currentAttempt.assessmentId === assessmentId;

      if (currentAttempt && !isMatchingAttempt) {
        // A stored attempt no longer matches the server-side identity
        // (assessment/rules changed for the selected case). Fail closed
        // locally — the eager invalidation effect should already have cleared
        // it — and never let a mismatched attempt reach the gateway.
        throw new Error('Percobaan CDD sebelumnya sudah tidak valid. Buat permintaan approval baru.');
      }

      const attempt: CddAttempt = isMatchingAttempt
        ? currentAttempt!
        : {
            caseId: input.caseId,
            assessmentId,
            rulesVersion: input.rulesVersion,
            idempotencyKey: input.idempotencyKey || crypto.randomUUID(),
          };

      setCurrentAttempt(attempt);

      return service.approveNotaryCdd({
        caseId: attempt.caseId,
        assessmentId: attempt.assessmentId,
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
    service.submitNotaryStamping({
      caseId: input.caseId,
      fileName: input.file.name,
      fileType: input.file.type,
      fileSize: input.file.size,
      kemenkumhamNumber: input.kemenkumhamNumber,
      nibNumber: input.nibNumber,
    })
  ));

  // Eager invalidation (3.C.5): when a canonical refresh changes the
  // assessment identity or rules version of the selected case, invalidate the
  // stored CDD attempt immediately and clear the retry buffer. A fresh execute
  // is then required, which generates a new idempotency key.
  const activeAssessment = activeWorkspace?.cddAssessment;
  useEffect(() => {
    if (!currentAttempt || !activeWorkspace) return;
    if (activeWorkspace.caseId !== currentAttempt.caseId) return;
    const assessmentChanged = currentAttempt.assessmentId !== activeAssessment?.assessmentId;
    const rulesChanged = currentAttempt.rulesVersion !== activeAssessment?.rulesVersion;
    if (assessmentChanged || rulesChanged) {
      setCurrentAttempt(null);
      cddApproval.reset();
    }
  }, [currentAttempt, activeWorkspace, activeAssessment, cddApproval]);

  // Selecting another case invalidates the old CDD attempt. Repair (3.C.5):
  // clear both the CddAttempt tuple AND the underlying usePhase2Mutation
  // retry buffer via its existing reset boundary, so a stale retry rejects
  // locally and never reaches the gateway.
  const selectCase = (caseId: string | null) => {
    setSelectedCaseId(caseId);
    if (currentAttempt && currentAttempt.caseId !== caseId) {
      setCurrentAttempt(null);
      cddApproval.reset();
    }
  };

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
