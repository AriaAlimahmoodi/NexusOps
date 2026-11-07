import type { AgentJsonVectorStoreConfig, VectorStoreTestResult } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { CredentialsService } from '../../credentials/credentials.service';
export declare class AgentVectorStoresService {
    private readonly credentialsService;
    constructor(credentialsService: CredentialsService);
    testConnection(projectId: string, user: User, vectorStore: AgentJsonVectorStoreConfig): Promise<VectorStoreTestResult>;
    private checkProviderCompatibility;
    private embedTestQuery;
    private probeBackend;
}
