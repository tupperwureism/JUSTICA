import { phase2IntegrationService } from '@/services/phase2SupabaseGateway';
import { usePhase2Mutation } from './usePhase2Mutation';
import { usePhase2Query } from './usePhase2Query';
import type { CorporateIntakeInput } from '@/services/phase2IntegrationService';

function generateId(): string {
  return crypto.randomUUID();
}

export function useClientCorporateIntegration() {
  const workspace = usePhase2Query(
    () => phase2IntegrationService.loadClientCorporateWorkspace(),
  );

  const intake = usePhase2Mutation(
    async (draft: CorporateIntakeInput) => {
      const orderId = generateId();
      const idempotencyKey = generateId();
      return phase2IntegrationService.submitCorporateIntake({ draft, orderId, idempotencyKey });
    },
    { onSuccess: async () => { await workspace.refresh(); } },
  );

  const escrow = usePhase2Mutation(
    phase2IntegrationService.refreshCorporateEscrow,
    { onSuccess: async () => { await workspace.refresh(); } },
  );

  return { workspace, intake, escrow };
}
