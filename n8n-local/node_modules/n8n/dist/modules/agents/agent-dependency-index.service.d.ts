import { Logger } from '@n8n/backend-common';
import { WorkflowsConfig } from '@n8n/config';
import { AgentRuntimeCacheService } from './agent-runtime-cache.service';
import { AgentCredentialDependencyRepository } from './repositories/agent-credential-dependency.repository';
import { AgentWorkflowDependencyRepository } from './repositories/agent-workflow-dependency.repository';
import { AgentRepository } from './repositories/agent.repository';
export declare class AgentDependencyIndexService {
    private readonly credentialDependencyRepository;
    private readonly workflowDependencyRepository;
    private readonly agentRepository;
    private readonly runtimeCache;
    private readonly batchSize;
    private readonly logger;
    constructor(credentialDependencyRepository: AgentCredentialDependencyRepository, workflowDependencyRepository: AgentWorkflowDependencyRepository, agentRepository: AgentRepository, runtimeCache: AgentRuntimeCacheService, logger: Logger, workflowsConfig: WorkflowsConfig);
    remove(agentId: string): Promise<void>;
    refresh(agentId: string): Promise<void>;
    invalidateRuntimesForWorkflow(workflowId: string): Promise<void>;
    invalidateRuntimesForCredential(credentialId: string): Promise<void>;
    buildIndex(): Promise<void>;
}
