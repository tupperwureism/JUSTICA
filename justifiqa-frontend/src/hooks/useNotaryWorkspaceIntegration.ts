import { phase2IntegrationService } from '@/services/phase2SupabaseGateway';
import type { NotaryStampingRequest } from '@/components/corporate/notary/KemenkumhamStampingModal';
import { usePhase2Mutation } from './usePhase2Mutation';
import { usePhase2Query } from './usePhase2Query';

type StampingInput = NotaryStampingRequest & { caseId: string };

export function useNotaryWorkspaceIntegration() {
  const workspace = usePhase2Query(
    () => phase2IntegrationService.loadNotaryWorkspace(),
  );
  const cddApproval = usePhase2Mutation(
    (input: { caseId: string; rulesVersion: string }) => (
      phase2IntegrationService.approveNotaryCdd(input)
    ),
    { onSuccess: async () => { await workspace.refresh(); } },
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

  return { workspace, cddApproval, stamping };
}
