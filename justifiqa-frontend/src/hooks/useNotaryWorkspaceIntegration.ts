import { useMemo, useState } from 'react';
import { phase2IntegrationService } from '@/services/phase2SupabaseGateway';
import type { NotaryStampingRequest } from '@/components/corporate/notary/KemenkumhamStampingModal';
import { usePhase2Mutation } from './usePhase2Mutation';
import { usePhase2Query } from './usePhase2Query';

type StampingInput = NotaryStampingRequest & { caseId: string };

export function useNotaryWorkspaceIntegration() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

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

  const cddApproval = usePhase2Mutation(
    (input: { caseId: string; rulesVersion: string; idempotencyKey?: string }) => (
      phase2IntegrationService.approveNotaryCdd(input)
    ),
    {
      onSuccess: async () => {
        await workspacesQuery.refresh();
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
    setSelectedCaseId,
    cddApproval,
    stamping,
  };
}
