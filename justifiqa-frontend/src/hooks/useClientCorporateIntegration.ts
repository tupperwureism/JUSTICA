import { phase2IntegrationService } from '@/services/phase2SupabaseGateway';
import { createUseClientCorporateIntegration } from './useClientCorporateIntegrationFactory';

export {
  createUseClientCorporateIntegration,
  type ClientCorporateIntegrationService,
} from './useClientCorporateIntegrationFactory';

export const useClientCorporateIntegration =
  createUseClientCorporateIntegration(phase2IntegrationService);
