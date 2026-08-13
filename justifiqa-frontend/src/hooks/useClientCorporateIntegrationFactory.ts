import { usePhase2Mutation } from './usePhase2Mutation';
import { usePhase2Query } from './usePhase2Query';
import type {
  ClientCorporateWorkspace,
  CorporateIntakeInput,
  SubmitCorporateIntakeResult,
} from '@/services/phase2IntegrationService';

type CorporateIntakeAttempt = {
  draft: CorporateIntakeInput;
  orderId: string;
  idempotencyKey: string;
};

export type ClientCorporateIntegrationService = {
  loadClientCorporateWorkspace(): Promise<ClientCorporateWorkspace | null>;
  submitCorporateIntake(
    attempt: CorporateIntakeAttempt,
  ): Promise<SubmitCorporateIntakeResult>;
  refreshCorporateEscrow(caseId: string): Promise<ClientCorporateWorkspace>;
};

export function createUseClientCorporateIntegration(
  service: ClientCorporateIntegrationService,
) {
  return function useClientCorporateIntegration() {
    const workspace = usePhase2Query(
      () => service.loadClientCorporateWorkspace(),
    );

    const intake = usePhase2Mutation<CorporateIntakeAttempt, unknown>(
      async (attempt) => service.submitCorporateIntake(attempt),
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
      service.refreshCorporateEscrow,
      { onSuccess: async () => { await workspace.refresh(); } },
    );

    return { workspace, intake: { ...intake, execute: submit }, escrow };
  };
}
