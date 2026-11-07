import type { BuiltAgent, BuiltTool, CredentialProvider } from '@n8n/agents';
import type { BudgetGuardrailConfig } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { AiConfig } from '@n8n/config';
import type { JSONSchema7 } from 'json-schema';
import { type ExecuteAgentData, type ExecuteAgentWorkflowContext, type InlineAgentPayload } from 'n8n-workflow';
import { CredentialsService } from '../../credentials/credentials.service';
import type { AgentRunTelemetryType } from '../../interfaces';
import { ExecutionLevelTracer } from '../../modules/otel/execution-level-tracer';
import { Telemetry } from '../../telemetry';
import { AgentRunTracingService } from './agent-run-tracing.service';
import type { AgentRuntimeInstrumentation, PrepareWorkflowAgentForEval } from './agent-runtime-instrumentation';
import { AgentRuntimeReconstructionService } from './agent-runtime-reconstruction.service';
import { AgentsSettingsService } from './agents-settings.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import { type AgentSandboxPrincipalHash } from './agent-sandbox-principal';
import { AgentTurnExecutionService } from './agent-turn-execution.service';
import { IntegrationMessageContextService } from './integrations/integration-message-context.service';
import { NodeToolAiGatewayService } from './json-config/node-tool-ai-gateway.service';
import { AgentRepository } from './repositories/agent.repository';
import { type AgentRunSource } from './utils/agent-published-snapshot';
import { type WorkflowAgentStreamObserver } from './workflow-agent-stream';
interface WorkflowSandboxScope {
    principalHash: AgentSandboxPrincipalHash;
}
export interface WorkflowAgentRunOptions {
    streamObserver?: WorkflowAgentStreamObserver;
    prepareForEval?: PrepareWorkflowAgentForEval;
}
export declare class AgentWorkflowExecutionService {
    private readonly logger;
    private readonly agentRepository;
    private readonly turnExecutionService;
    private readonly telemetry;
    private readonly credentialsService;
    private readonly agentRuntimeReconstructionService;
    private readonly agentRunTracingService;
    private readonly executionLevelTracer;
    private readonly nodeToolAiGatewayService;
    private readonly aiConfig;
    private readonly integrationMessageContextService;
    private readonly settingsService;
    private readonly agentSkillRefs;
    constructor(logger: Logger, agentRepository: AgentRepository, turnExecutionService: AgentTurnExecutionService, telemetry: Telemetry, credentialsService: CredentialsService, agentRuntimeReconstructionService: AgentRuntimeReconstructionService, agentRunTracingService: AgentRunTracingService, executionLevelTracer: ExecutionLevelTracer, nodeToolAiGatewayService: NodeToolAiGatewayService, aiConfig: AiConfig, integrationMessageContextService: IntegrationMessageContextService, settingsService: AgentsSettingsService, agentSkillRefs: AgentSkillRefsService);
    private normalizeWorkflowStreamError;
    private applyPerCallAgentExtras;
    compileIsolated(runSource: AgentRunSource, credentialProvider: CredentialProvider, runType: AgentRunTelemetryType, outputSchema?: JSONSchema7, extraTools?: BuiltTool[], sandboxPrincipalHash?: AgentSandboxPrincipalHash, instrumentation?: AgentRuntimeInstrumentation): Promise<{
        ok: boolean;
        agent?: BuiltAgent;
        budget?: BudgetGuardrailConfig;
        error?: string;
    }>;
    private compileIsolatedFromSource;
    private buildWorkflowExtraTools;
    private consumeWorkflowAgentStream;
    private runWorkflowAgentStream;
    private getWorkflowStreamOptions;
    private recordWorkflowChunk;
    private collectWorkflowChunk;
    private streamWorkflowAgent;
    private buildWorkflowResult;
    private assertWorkflowRunSucceeded;
    private workflowFailureMessage;
    executeForWorkflow(agentId: string, message: string, executionId: string, threadId: string, projectId: string, telemetryUserId?: string, useDraftVersion?: boolean, outputSchema?: JSONSchema7, workflowContext?: ExecuteAgentWorkflowContext, sandboxScope?: WorkflowSandboxScope, { streamObserver, prepareForEval }?: WorkflowAgentRunOptions): Promise<ExecuteAgentData>;
    private closeAgentQuietly;
    private executeForWorkflowInternal;
    private prepareStoredWorkflowRun;
    private loadWorkflowAgent;
    private applyEvalSetup;
    private streamCompiledWorkflowAgent;
    executeInlineForWorkflow(inlineAgent: InlineAgentPayload, message: string, executionId: string, threadId: string, projectId: string, telemetryUserId?: string, runType?: AgentRunTelemetryType, outputSchema?: JSONSchema7, workflowContext?: ExecuteAgentWorkflowContext, { streamObserver, prepareForEval }?: WorkflowAgentRunOptions): Promise<ExecuteAgentData>;
    private prepareInlineRuntime;
    private trackInlineRun;
    private validateInlineAgentConfig;
}
export {};
