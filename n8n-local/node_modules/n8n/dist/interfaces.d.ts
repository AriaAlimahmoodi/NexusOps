import type { ICredentialsBase, IExecutionBase, IExecutionDb, ITagBase, IWorkflowDb } from '@n8n/db';
import type { AssignableGlobalRole } from '@n8n/permissions';
import type { IDeferredPromise } from '@n8n/utils/promise/deferred-promise';
import type { Application, Response } from 'express';
import type { ExecutionError, ICredentialDataDecryptedObject, ICredentialsDecrypted, IExecuteResponsePromiseData, IRun, ITelemetryTrackProperties, IWorkflowBase, CredentialLoadingDetails, WorkflowExecuteMode, ExecutionStatus, ExecutionSummary, IWorkflowExecutionDataProcess, IExecutionContext, WorkflowExecutionSource, ExecutionStorageLocation } from 'n8n-workflow';
import type PCancelable from 'p-cancelable';
import type { ActiveWorkflowManager } from './active-workflow-manager';
import type { ExternalHooks } from './external-hooks';
export interface ICredentialsTypeData {
    [key: string]: CredentialLoadingDetails;
}
export interface ICredentialsOverwrite {
    [key: string]: ICredentialDataDecryptedObject;
}
export interface ITagToImport extends ITagBase {
    createdAt?: string;
    updatedAt?: string;
}
export interface IWorkflowResponse extends IWorkflowBase {
    id: string;
}
export interface IWorkflowVersionMetadata {
    versionMetadata?: {
        name: string | null;
        description: string | null;
    } | null;
}
export interface IWorkflowToImport extends Omit<IWorkflowBase, 'staticData' | 'pinData' | 'createdAt' | 'updatedAt' | 'activeVersion'>, IWorkflowVersionMetadata {
    owner?: {
        type: 'personal';
        personalEmail: string;
    } | {
        type: 'team';
        teamId: string;
        teamName: string;
    };
    parentFolderId: string | null;
}
export type IWorkflowWithVersionMetadata = IWorkflowDb & IWorkflowVersionMetadata;
export type ICredentialsDecryptedDb = ICredentialsBase & ICredentialsDecrypted;
export type ICredentialsDecryptedResponse = ICredentialsDecryptedDb;
export type SaveExecutionDataType = 'all' | 'none';
export type UpdateExecutionPayload = Omit<IExecutionDb, 'id' | 'createdAt' | 'storedAt'>;
export interface IExecutionFlatted extends IExecutionBase {
    data: string;
    workflowData: IWorkflowBase;
}
export interface IExecutionFlattedResponse extends IExecutionFlatted {
    id: string;
    retryOf?: string;
    dataTooLargeToDisplay?: boolean;
}
export interface IExecutionsListResponse {
    count: number;
    results: ExecutionSummary[];
    estimated: boolean;
}
export interface ExecutionStopResult {
    finished?: boolean;
    mode: WorkflowExecuteMode;
    startedAt: Date;
    stoppedAt?: Date;
    status: ExecutionStatus;
}
export interface IExecutionsCurrentSummary {
    id: string;
    retryOf?: string;
    startedAt: Date;
    mode: WorkflowExecuteMode;
    workflowId: string;
    status: ExecutionStatus;
}
export interface ResumableExecution {
    executionId: string;
    expectedStatus: Extract<ExecutionStatus, 'new' | 'waiting'>;
    storedAt?: ExecutionStorageLocation;
}
export interface IExecutingWorkflowData {
    executionData: IWorkflowExecutionDataProcess;
    startedAt: Date;
    postExecutePromise: IDeferredPromise<IRun | undefined>;
    httpResponse?: Response;
    responsePromise?: IDeferredPromise<IExecuteResponsePromiseData>;
    workflowExecution?: PCancelable<IRun>;
    status: ExecutionStatus;
    isQueueJob?: boolean;
}
export interface IActiveDirectorySettings {
    enabled: boolean;
}
export interface IPackageVersions {
    cli: string;
}
export interface IWorkflowErrorData {
    [key: string]: any;
    execution?: {
        id?: string;
        url?: string;
        retryOf?: string;
        error: ExecutionError;
        lastNodeExecuted: string;
        mode: WorkflowExecuteMode;
        executionContext?: IExecutionContext;
    };
    trigger?: {
        error: ExecutionError;
        mode: WorkflowExecuteMode;
    };
    workflow: {
        id?: string;
        name: string;
    };
}
export interface IWorkflowStatisticsDataLoaded {
    dataLoaded: boolean;
}
export interface IExecutionTrackProperties extends ITelemetryTrackProperties {
    workflow_id: string;
    success: boolean;
    error_node_type?: string;
    is_manual: boolean;
    crashed?: boolean;
    used_end_user_credentials?: boolean;
    end_user_credentials_attempted_count?: number;
    end_user_credentials_resolved_count?: number;
    credential_resolver_id?: string;
    execution_source?: WorkflowExecutionSource;
    mock_data_sources?: string;
}
export interface IAgentExecutionTrackProperties extends ITelemetryTrackProperties {
    agent_id: string;
    user_id?: string;
    run_type: AgentRunTelemetryType;
    source?: string;
    message_count?: number;
    token_count?: number;
    tool_call_count?: number;
}
export type AgentRunTelemetryType = 'test' | 'production';
export type AgentTurnTelemetryStatus = 'succeeded' | 'failed';
export type AgentTelemetryMemoryType = 'none' | 'n8n' | 'n8n_observational' | 'n8n_episodic' | 'n8n_observational_episodic';
export interface IAgentConfigurationTelemetryProperties {
    model: string | null;
    channels: string[];
    tool_types: string[];
    tool_count: number;
    num_skills: number;
    memory_type: AgentTelemetryMemoryType;
}
export interface IAgentTurnFinishedTrackProperties extends ITelemetryTrackProperties {
    agent_id: string;
    user_id?: string;
    thread_id: string;
    run_type: AgentRunTelemetryType;
    source?: string;
    agent_type?: 'inline';
    turn_status: AgentTurnTelemetryStatus;
    configuration: IAgentConfigurationTelemetryProperties;
    latency_ms: number;
    cost: number;
    token_count: number;
    tool_call_count: number;
}
export interface ILicenseReadResponse {
    usage: {
        activeWorkflowTriggers: {
            limit: number;
            value: number;
            warningThreshold: number;
        };
        workflowsHavingEvaluations: {
            limit: number;
            value: number;
        };
    };
    license: {
        planId: string;
        planName: string;
    };
}
export interface ILicensePostResponse extends ILicenseReadResponse {
    managementToken: string;
}
export interface Invitation {
    email: string;
    role: AssignableGlobalRole;
}
export interface N8nApp {
    app: Application;
    restEndpoint: string;
    externalHooks: ExternalHooks;
    activeWorkflowManager: ActiveWorkflowManager;
}
