import { Workspace } from '@n8n/agents';
import { Logger } from '@n8n/backend-common';
import { AgentsConfig } from '@n8n/config';
import type { AgentSandboxPrincipalHash } from './agent-sandbox-principal';
import { AgentSandboxRuntimeService, type AgentSandboxRuntime } from './agent-sandbox-runtime.service';
import { N8NCheckpointStorage } from './integrations/n8n-checkpoint-storage';
export interface AgentWorkspaceAcquisition {
    workspace: Workspace;
    handle: AgentSandboxRuntime;
}
export declare class AgentWorkspaceService {
    private readonly logger;
    private readonly agentSandboxRuntimeService;
    private readonly checkpointStorage;
    private readonly agentsConfig;
    private readonly pendingReconciliations;
    constructor(logger: Logger, agentSandboxRuntimeService: AgentSandboxRuntimeService, checkpointStorage: N8NCheckpointStorage, agentsConfig: AgentsConfig);
    getAgentWorkspace(projectId: string, agentId: string, principalHash: AgentSandboxPrincipalHash): Promise<AgentWorkspaceAcquisition>;
    getDelegatedAgentWorkspace(handle: AgentSandboxRuntime, delegationThreadId: string): Workspace;
    private withCoreToolsOnly;
    private reconcileToolResultsInBackground;
}
