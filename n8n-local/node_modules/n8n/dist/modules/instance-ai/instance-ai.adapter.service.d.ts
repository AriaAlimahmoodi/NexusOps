import { LicenseState, Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { EventService, RoleService, CredentialsFinderService, FolderFinderService, InstanceWriteAccessService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import type { User, EvaluationConfig } from '@n8n/db';
import { AiBuilderTemporaryWorkflowRepository, ExecutionRepository, FolderRepository, ProjectRepository, SharedWorkflowRepository, WorkflowRepository } from '@n8n/db';
import type { InstanceAiContext, InstanceAiConversationHistoryReader, ExecutionResult, ExecutionDebugInfo, NodeOutputResult, ServiceProxyConfig, EvaluationConfigSummary, EvaluationConfigDetail, UpsertEvaluationConfigInput, ExecuteNodeResult as InstanceAiExecuteNodeResult, ModelConfig } from '@n8n/instance-ai';
import { InstanceSettings } from 'n8n-core';
import { type ExecutionError } from 'n8n-workflow';
import { ActiveExecutions } from '../../active-executions';
import { CollaborationService } from '../../collaboration/collaboration.service';
import { CredentialsService } from '../../credentials/credentials.service';
import { EvaluationConfigService } from '../../evaluation.ee/evaluation-config.service';
import { LlmJudgeProviderRegistry } from '../../evaluation.ee/llm-judge-provider-registry';
import { ExecutionPersistence } from '../../executions/execution-persistence';
import { License } from '../../license';
import { LoadNodesAndCredentials } from '../../load-nodes-and-credentials';
import type { EvalCredentialTestTarget } from './eval/thread-credential-allowlist.service';
import { DataTableRepository } from '../../modules/data-table/data-table.repository';
import { DataTableService } from '../../modules/data-table/data-table.service';
import { WorkflowDependencyQueryService } from '../../modules/workflow-index/workflow-dependency-query.service';
import { NodeCatalogService } from '../../node-catalog';
import { ExecuteNodeService } from '../../node-execution';
import type { ExecuteNodeResult } from '../../node-execution';
import { NodeTypes } from '../../node-types';
import { PolicyEnforcementService } from '../../policy/policy-enforcement.service';
import { AiGatewayService } from '../../services/ai-gateway.service';
import { AiPreferenceService } from '../../services/ai-preference.service';
import { FolderService } from '../../services/folder.service';
import { NodeResourceExplorerService } from '../../services/node-resource-explorer.service';
import { ProjectService } from '../../services/project.service.ee';
import { TagService } from '../../services/tag.service';
import { Telemetry } from '../../telemetry';
import { WorkflowRunner } from '../../workflow-runner';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
import { WorkflowHistoryService } from '../../workflows/workflow-history/workflow-history.service';
import { WorkflowService } from '../../workflows/workflow.service';
import { EnterpriseWorkflowService } from '../../workflows/workflow.service.ee';
import { InstanceAiSettingsService } from './instance-ai-settings.service';
import { InstanceContextService } from './instance-context.service';
import { WorkflowTemplatesService } from './workflow-templates.service';
export interface InstanceAiFeatureFlags {
    configEvalsEnabled: boolean;
    conversationHistoryEnabled: boolean;
    progressiveBuildingEnabled: boolean;
    conciseStyleEnabled: boolean;
    setupPanelEnabled: boolean;
    setupPanelVariant?: 'control' | 'variant';
    nodeUsageEnabled: boolean;
    nodeContextEnabled: boolean;
    folderExplorationEnabled: boolean;
    aiPreferencesEnabled: boolean;
    credentialDescriptionsEnabled: boolean;
    instanceContextEnabled: boolean;
}
export declare class InstanceAiAdapterService {
    private readonly globalConfig;
    private readonly workflowService;
    private readonly workflowFinderService;
    private readonly workflowRepository;
    private readonly sharedWorkflowRepository;
    private readonly projectRepository;
    private readonly executionRepository;
    private readonly credentialsService;
    private readonly credentialsFinderService;
    private readonly activeExecutions;
    private readonly workflowRunner;
    private readonly loadNodesAndCredentials;
    private readonly nodeTypes;
    private readonly instanceSettings;
    private readonly dataTableService;
    private readonly dataTableRepository;
    private readonly nodeResourceExplorerService;
    private readonly folderService;
    private readonly projectService;
    private readonly tagService;
    private readonly instanceWriteAccess;
    private readonly settingsService;
    private readonly workflowHistoryService;
    private readonly enterpriseWorkflowService;
    private readonly license;
    private readonly executionPersistence;
    private readonly eventService;
    private readonly roleService;
    private readonly telemetry;
    private readonly aiBuilderTemporaryWorkflowRepository;
    private readonly outboundHttp;
    private readonly aiGatewayService;
    private readonly workflowTemplatesService;
    private readonly collaborationService;
    private readonly policyEnforcementService;
    private readonly nodeCatalogService?;
    private readonly evaluationConfigService?;
    private readonly llmJudgeProviderRegistry?;
    private readonly workflowDependencyQueryService?;
    private readonly folderRepository?;
    private readonly folderFinderService?;
    private readonly instanceContext?;
    private readonly executeNodeService?;
    private readonly licenseState?;
    private readonly aiPreferenceService?;
    private readonly logger;
    private readonly allowSendingParameterValues;
    private nodesCache;
    private readonly NODES_CACHE_TTL_MS;
    private templatesService;
    private getNodesFromCache;
    constructor(logger: Logger, globalConfig: GlobalConfig, workflowService: WorkflowService, workflowFinderService: WorkflowFinderService, workflowRepository: WorkflowRepository, sharedWorkflowRepository: SharedWorkflowRepository, projectRepository: ProjectRepository, executionRepository: ExecutionRepository, credentialsService: CredentialsService, credentialsFinderService: CredentialsFinderService, activeExecutions: ActiveExecutions, workflowRunner: WorkflowRunner, loadNodesAndCredentials: LoadNodesAndCredentials, nodeTypes: NodeTypes, instanceSettings: InstanceSettings, dataTableService: DataTableService, dataTableRepository: DataTableRepository, nodeResourceExplorerService: NodeResourceExplorerService, folderService: FolderService, projectService: ProjectService, tagService: TagService, instanceWriteAccess: InstanceWriteAccessService, settingsService: InstanceAiSettingsService, workflowHistoryService: WorkflowHistoryService, enterpriseWorkflowService: EnterpriseWorkflowService, license: License, executionPersistence: ExecutionPersistence, eventService: EventService, roleService: RoleService, telemetry: Telemetry, aiBuilderTemporaryWorkflowRepository: AiBuilderTemporaryWorkflowRepository, outboundHttp: OutboundHttp, aiGatewayService: AiGatewayService, workflowTemplatesService: WorkflowTemplatesService, collaborationService: CollaborationService, policyEnforcementService: PolicyEnforcementService, nodeCatalogService?: NodeCatalogService | undefined, evaluationConfigService?: EvaluationConfigService | undefined, llmJudgeProviderRegistry?: LlmJudgeProviderRegistry | undefined, workflowDependencyQueryService?: WorkflowDependencyQueryService | undefined, folderRepository?: FolderRepository | undefined, folderFinderService?: FolderFinderService | undefined, instanceContext?: InstanceContextService | undefined, executeNodeService?: ExecuteNodeService | undefined, licenseState?: LicenseState | undefined, aiPreferenceService?: AiPreferenceService | undefined);
    createContext(user: User, options?: {
        searchProxyConfig?: ServiceProxyConfig;
        pushRef?: string;
        threadId?: string;
        projectId?: string;
        getCredentialIdAllowlist?: () => string[] | undefined;
        shouldBypassCredentialTest?: (credentialId: string) => boolean;
        getCredentialTestTarget?: (credentialType: string) => EvalCredentialTestTarget | undefined;
        agentId?: string;
        configEvalsEnabled?: boolean;
        setupPanelVariant?: 'control' | 'variant';
        mcpConnectionsAvailable?: boolean;
        nodeUsageEnabled?: boolean;
        instanceContextEnabled?: boolean;
        conversationHistory?: InstanceAiConversationHistoryReader;
        folderExplorationEnabled?: boolean;
        onboardingThread?: boolean;
        credentialDescriptionsEnabled?: boolean;
        aiPreferencesEnabled?: boolean;
        modelId?: ModelConfig;
        allowSendingParameterValues?: boolean;
    }): InstanceAiContext;
    private createAgentCredentialProvider;
    private getBuilderDelegateAdapter;
    private getGatewayConfigOrNull;
    resolveExperimentGates(user: User): Promise<InstanceAiFeatureFlags>;
    private createActivityAdapter;
    private createPreferenceAdapter;
    private createMcpAdapter;
    private createExecuteNodeAdapter;
    private listMcpRegistryConnections;
    private buildAiGatewayNodeMeta;
    private getTemplatesService;
    private createWorkflowTemplateAdapter;
    private teamProjectsLicensed;
    private buildLicenseHints;
    private trackGatewayAvailability;
    private assertInstanceNotReadOnly;
    private createProjectScopeHelpers;
    private createWorkflowAdapter;
    private createExecutionAdapter;
    private createCredentialAdapter;
    private createEvaluationConfigAdapter;
    private createDataTableAdapter;
    private readonly webResearchCache;
    private readonly searchCache;
    private createWebResearchAdapter;
    private buildSearchMethod;
    private _nodeDefinitionDirs?;
    getNodeDefinitionDirs(): string[];
    private getNodeCatalogService;
    private createNodeAdapter;
    private createWorkspaceAdapter;
}
interface DataTableRecord {
    id: string;
    name: string;
    projectId: string;
}
interface DataTableIdOrNameRepository {
    findOneBy: (where: {
        id: string;
    }) => Promise<DataTableRecord | null>;
    findBy: (where: {
        name: string;
        projectId?: string;
    }) => Promise<DataTableRecord[]>;
}
interface DataTableResolverLogger {
    warn: (message: string, meta?: Record<string, unknown>) => void;
}
export type ResolveDataTableResult = {
    kind: 'hit';
    table: DataTableRecord;
} | {
    kind: 'miss';
} | {
    kind: 'ambiguous';
    candidates: DataTableRecord[];
};
interface ResolveMetricProvidersDeps {
    user: User;
    credentialsFinderService: CredentialsFinderService;
    llmJudgeProviderRegistry?: LlmJudgeProviderRegistry;
}
export declare function resolveMetricProviders(input: UpsertEvaluationConfigInput, deps: ResolveMetricProvidersDeps): Promise<UpsertEvaluationConfigInput>;
export declare function buildEvaluationConfigDto(input: UpsertEvaluationConfigInput): {
    name: string;
    startNodeName: string;
    endNodeName: string;
    metrics: ({
        id: string;
        name: string;
        type: "expression";
        config: {
            expression: string;
            outputType: "boolean" | "numeric";
        };
    } | {
        id: string;
        name: string;
        type: "llm_judge";
        config: {
            preset: "correctness" | "helpfulness";
            prompt?: string | undefined;
            provider: string;
            credentialId: string;
            model: string;
            outputType: "boolean" | "numeric";
            inputs: {
                actualAnswer: string;
                userQuery?: string | undefined;
                expectedAnswer?: string | undefined;
            };
        };
    } | {
        id: string;
        name: string;
        type: "string_similarity";
        config: {
            inputs: {
                actualAnswer: string;
                expectedAnswer: string;
            };
        };
    } | {
        id: string;
        name: string;
        type: "categorization";
        config: {
            inputs: {
                actualAnswer: string;
                expectedAnswer: string;
            };
        };
    } | {
        id: string;
        name: string;
        type: "tools_used";
        config: {
            inputs: {
                expectedTools: string;
                intermediateSteps: string;
            };
        };
    })[];
} & ({
    datasetSource: "data_table";
    datasetRef: {
        dataTableId: string;
    };
} | {
    datasetSource: "google_sheets";
    datasetRef: {
        credentialId: string;
        spreadsheetId: string;
        sheetName: string;
        headerRow?: number | undefined;
    };
});
export declare function evaluationConfigToSummary(config: EvaluationConfig): EvaluationConfigSummary;
export declare function evaluationConfigToDetail(config: EvaluationConfig): EvaluationConfigDetail;
export declare function resolveDataTableByIdOrName(repository: DataTableIdOrNameRepository, logger: DataTableResolverLogger, idOrName: string, options?: {
    projectIdFilter?: string;
    accessFilter?: (id: string) => Promise<boolean>;
}): Promise<ResolveDataTableResult>;
export declare function truncateResultData(resultData: Record<string, unknown>): Record<string, unknown>;
export declare function extractExecutionResult(executionId: string, includeOutputData?: boolean, nodeTypes?: NodeTypes): Promise<ExecutionResult>;
export declare function extractExecutionOutcome(executionId: string, includeOutputData?: boolean, nodeTypes?: NodeTypes, subNodeTarget?: string): Promise<{
    result: ExecutionResult;
    telemetryError?: string;
}>;
export declare function formatExecutionError(error: ExecutionError, includeUpstreamDetails: boolean): string;
export declare function truncateNodeOutput(items: unknown[]): unknown[] | unknown;
export declare function redactExecuteNodeResult(result: ExecuteNodeResult, allowSendingParameterValues: boolean): InstanceAiExecuteNodeResult;
export declare function extractNodeOutput(executionId: string, nodeName: string, options?: {
    startIndex?: number;
    maxItems?: number;
}, nodeTypes?: NodeTypes): Promise<NodeOutputResult>;
export declare function extractExecutionDebugInfo(executionId: string, includeOutputData?: boolean, nodeTypes?: NodeTypes): Promise<ExecutionDebugInfo>;
export {};
