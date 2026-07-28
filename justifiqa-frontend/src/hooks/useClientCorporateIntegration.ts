import { phase2IntegrationService } from '@/services/phase2SupabaseGateway';
import { usePhase2Mutation } from './usePhase2Mutation';
import { usePhase2Query } from './usePhase2Query';

export function useClientCorporateIntegration() {
  const workspace = usePhase2Query(
    () => phase2IntegrationService.loadClientCorporateWorkspace(),
  );
  const intake = usePhase2Mutation(
    phase2IntegrationService.submitCorporateIntake,
    { onSuccess: async () => { await workspace.refresh(); } },
  );
  const escrow = usePhase2Mutation(
    phase2IntegrationService.refreshCorporateEscrow,
    { onSuccess: async () => { await workspace.refresh(); } },
  );

  return { workspace, intake, escrow };
}
