import type { AgentJsonConfig, InstanceAiEvalAgentExecutionRequest, InstanceAiEvalAgentExecutionResult, InstanceAiEvalAgentSkippedFeature } from '@n8n/api-types';
import { Logger, ModuleRegistry } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { ExecutionsConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import { CredentialsService } from '../../../credentials/credentials.service';
import type { Agent as AgentEntity } from '../../../modules/agents/entities/agent.entity';
import { type AgentSeedToolSummary } from './agent-scenario-seed';
import { type McpMockCanonicalTool } from './mcp-mock-fetch';
export declare function mcpUrlsMatch(configUrl: string, remoteUrl: string): boolean;
export declare function resolveCanonicalMcpCatalogs(mcpServers: NonNullable<AgentJsonConfig['mcpServers']>, moduleRegistry: ModuleRegistry, logger: Logger): Promise<Record<string, McpMockCanonicalTool[]> | undefined>;
export declare class EvalAgentExecutionService {
    private readonly logger;
    private readonly executionsConfig;
    private readonly moduleRegistry;
    private readonly outboundHttp;
    private readonly credentialsService;
    constructor(logger: Logger, executionsConfig: ExecutionsConfig, moduleRegistry: ModuleRegistry, outboundHttp: OutboundHttp, credentialsService: CredentialsService);
    executeWithLlmMock(agentId: string, user: User, options: InstanceAiEvalAgentExecutionRequest, caseInput?: string): Promise<InstanceAiEvalAgentExecutionResult>;
    private createRecordingMockHandler;
    private errorResult;
}
export declare function pruneConfigForEval(original: AgentJsonConfig): {
    config: AgentJsonConfig;
    skippedFeatures: InstanceAiEvalAgentSkippedFeature[];
};
export declare function summarizeTools(config: AgentJsonConfig, customTools: NonNullable<AgentEntity['tools']>, sanitizeWorkflowToolName: (name: string) => string): AgentSeedToolSummary[];
