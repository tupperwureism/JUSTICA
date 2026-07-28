import { phase2IntegrationService } from '@/services/phase2SupabaseGateway';
import { usePhase2Mutation } from './usePhase2Mutation';
import { usePhase2Query } from './usePhase2Query';

export function useEkycIntegration() {
  const workspace = usePhase2Query(
    () => phase2IntegrationService.loadEkycWorkspace(),
  );
  const providerSession = usePhase2Mutation(
    phase2IntegrationService.beginEkycProviderSession,
    { onSuccess: async () => { await workspace.refresh(); } },
  );
  const envelope = usePhase2Mutation(
    phase2IntegrationService.createSigningEnvelope,
    { onSuccess: async () => { await workspace.refresh(); } },
  );

  return { workspace, providerSession, envelope };
}
