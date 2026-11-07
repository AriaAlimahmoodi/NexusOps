import type { BuiltTool, CreateDelegateSubAgentToolOptions } from '@n8n/agents';
import type { SubAgentSource } from '@n8n/api-types';
import type { AgentBackgroundJobService } from './agent-background-job.service';
import type { BackgroundSubAgentRunContext, SubAgentBackgroundRunner } from './sub-agent-background-runner';
export interface BackgroundJobToolsOptions {
    jobService: AgentBackgroundJobService;
    backgroundRunner: SubAgentBackgroundRunner;
    sourcesById: Record<string, SubAgentSource>;
    availableSubAgents: NonNullable<CreateDelegateSubAgentToolOptions['availableSubAgents']>;
    projectId: string;
    parentAgentId: string;
    runContext: BackgroundSubAgentRunContext;
}
export declare function createBackgroundSubAgentHandler(options: BackgroundJobToolsOptions): NonNullable<CreateDelegateSubAgentToolOptions['runBackgroundSubAgent']>;
export declare function createCheckBackgroundJobsTool(jobService: AgentBackgroundJobService): BuiltTool;
export declare function createResumeBackgroundJobsTool(options: Pick<BackgroundJobToolsOptions, 'jobService' | 'backgroundRunner' | 'projectId' | 'parentAgentId' | 'runContext'>): BuiltTool;
export declare function createCancelBackgroundJobTool(jobService: AgentBackgroundJobService): BuiltTool;
