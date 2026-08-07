import { phase2IntegrationService } from '@/services/phase2SupabaseGateway';
import { usePhase2Mutation } from './usePhase2Mutation';
import { usePhase2Query } from './usePhase2Query';
import type { CorporateIntakeInput } from '@/services/phase2IntegrationService';

type CorporateIntakeAttempt = {
  draft: CorporateIntakeInput;
  orderId: string;
  idempotencyKey: string;
};

export function useClientCorporateIntegration() {
  const workspace = usePhase2Query(
    () => phase2IntegrationService.loadClientCorporateWorkspace(),
  );

  const intake = usePhase2Mutation<CorporateIntakeAttempt, unknown>(
    async (attempt) => {
      return phase2IntegrationService.submitCorporateIntake(attempt);
    },
    { onSuccess: async () => { await workspace.refresh(); } },
  );

  const submit = (draft: CorporateIntakeInput) => {
    const attempt: CorporateIntakeAttempt = {
      draft,
      orderId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
    };
    return intake.execute(attempt);
  };

  const escrow = usePhase2Mutation(
    phase2IntegrationService.refreshCorporateEscrow,
    { onSuccess: async () => { await workspace.refresh(); } },
  );

  return { workspace, intake: { ...intake, execute: submit }, escrow };
}
