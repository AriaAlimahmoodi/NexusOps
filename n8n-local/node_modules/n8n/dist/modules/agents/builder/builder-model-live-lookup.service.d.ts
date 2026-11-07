import { OutboundHttp } from '@n8n/backend-network';
import type { User } from '@n8n/db';
import { CredentialsService } from '../../../credentials/credentials.service';
import { CredentialsHelper } from '../../../credentials-helper';
import { AiGatewayService } from '../../../services/ai-gateway.service';
import type { ModelChoice } from './model-lookup.types';
export type ModelCatalogPolicy = 'curated' | 'endpoint-only' | 'managed';
export type LiveModelLookupResult = {
    status: 'success';
    models: ModelChoice[];
    policy: ModelCatalogPolicy;
} | {
    status: 'unavailable';
    error: unknown;
    policy: ModelCatalogPolicy;
};
interface ModelLookupOptions {
    useEvalModelCatalog?: boolean;
}
export declare class BuilderModelLiveLookupService {
    private readonly credentialsService;
    private readonly credentialsHelper;
    private readonly outboundHttp;
    private readonly aiGatewayService;
    constructor(credentialsService: CredentialsService, credentialsHelper: CredentialsHelper, outboundHttp: OutboundHttp, aiGatewayService: AiGatewayService);
    list(user: User, projectId: string, credentialId: string, credentialType: string, provider: string, options?: ModelLookupOptions): Promise<ModelChoice[]>;
    lookup(user: User, projectId: string, credentialId: string, credentialType: string, provider: string, options?: ModelLookupOptions): Promise<LiveModelLookupResult>;
    private getEvalModelCatalog;
    private lookupAiGatewayManagedModels;
    private discoverModels;
    private getOpenAiHeaders;
}
export {};
