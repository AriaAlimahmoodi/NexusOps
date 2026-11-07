import { Logger } from '@n8n/backend-common';
import { ActivityEventRepository, ExecutionRepository, ProjectRepository, WorkflowRepository } from '@n8n/db';
import type { ActivityEventCategory, User } from '@n8n/db';
import type { InstanceAiActivityEntry, InstanceAiActivityExpansion } from '@n8n/instance-ai';
import type { InstanceContextAbsenceReason, InstanceContextInjection, InstanceContextLegs } from '@n8n/api-types';
import { ProjectService } from '../../services/project.service.ee';
export type InstanceContextScope = {
    surface: 'conversation';
    projectId?: string;
} | {
    surface: 'mcp';
    projectId?: string;
    credentialGranted: boolean;
    executionGranted: boolean;
};
export type ActivityPage = {
    entries: InstanceAiActivityEntry[];
    hasMore: boolean;
    nextBeforeId?: number;
};
export declare const INSTANCE_CONTEXT_CURSOR = "instanceContext";
export type InstanceContextCursor = {
    activityMark: number;
    activityFloor: number;
    activityCategories: ActivityEventCategory[];
    activitySeen: number[];
    activitySeenFloor?: number;
    runsThrough: string;
};
export declare function readInstanceContextCursor(metadata: Record<string, unknown> | undefined): InstanceContextCursor | null;
export type InstanceContextResult = {
    state: 'injected';
    block: string;
    cursor: InstanceContextCursor;
    legs: InstanceContextLegs;
    isUpdate: boolean;
} | {
    state: 'absent';
    reason: InstanceContextAbsenceReason;
};
export declare function toContextInjection(result: InstanceContextResult): InstanceContextInjection;
export declare function shouldTraceContextInjection(injection: InstanceContextInjection): boolean;
export declare class InstanceContextService {
    private readonly logger;
    private readonly activityEventRepository;
    private readonly executionRepository;
    private readonly workflowRepository;
    private readonly projectRepository;
    private readonly projectService;
    constructor(logger: Logger, activityEventRepository: ActivityEventRepository, executionRepository: ExecutionRepository, workflowRepository: WorkflowRepository, projectRepository: ProjectRepository, projectService: ProjectService);
    buildBlock(input: {
        user: User;
        scope: InstanceContextScope;
        cursor: InstanceContextCursor | null;
        isMachineFollowUp?: boolean;
        enabled: boolean;
        now?: Date;
    }): Promise<InstanceContextResult>;
    list(input: {
        user: User;
        scope: InstanceContextScope;
        limit: number;
        category?: string;
        resourceId?: string;
        beforeId?: number;
    }): Promise<InstanceAiActivityEntry[]>;
    listPage(input: {
        user: User;
        scope: InstanceContextScope;
        limit: number;
        category?: string;
        resourceId?: string;
        beforeId?: number;
    }): Promise<ActivityPage>;
    expand(input: {
        id: number;
        user: User;
        scope: InstanceContextScope;
    }): Promise<InstanceAiActivityExpansion | null>;
    private readEntries;
    private readRuns;
    private resolveScope;
    private credentialReadableProjectIds;
    hasWithheldWorkflows(user: User, scope: InstanceContextScope): Promise<boolean>;
    private withoutWithheldWorkflows;
}
