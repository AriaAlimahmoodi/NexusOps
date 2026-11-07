import { TestAgentVectorStoreDto, type VectorStoreTestResult } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AgentVectorStoresService } from './agent-vector-stores.service';
export declare class AgentVectorStoresController {
    private readonly agentVectorStoresService;
    constructor(agentVectorStoresService: AgentVectorStoresService);
    testConnection(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, payload: TestAgentVectorStoreDto): Promise<VectorStoreTestResult>;
}
