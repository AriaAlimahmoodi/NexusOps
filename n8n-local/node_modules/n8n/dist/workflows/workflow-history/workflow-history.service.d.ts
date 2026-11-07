import { UpdateWorkflowHistoryVersionDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import type { OperationContext, PublishHistoryScope, User } from '@n8n/db';
import { WorkflowHistory, WorkflowHistoryRepository, WorkflowPublishHistoryRepository, WorkflowRepository } from '@n8n/db';
import type { EntityManager } from '@n8n/typeorm';
import type { IWorkflowBase } from 'n8n-workflow';
import type { WorkflowActionSource } from '../../events/maps/relay.event-map';
import { WorkflowFinderService } from '../workflow-finder.service';
type WorkflowHistoryVersionInput = {
    user: User | string;
    workflow: {
        versionId: string;
        nodes: IWorkflowBase['nodes'];
        connections: IWorkflowBase['connections'];
        nodeGroups?: IWorkflowBase['nodeGroups'];
    };
    workflowId: string;
    autosaved?: boolean;
    source?: WorkflowActionSource;
    versionMetadata?: {
        name?: string;
        description?: string;
    };
};
export declare class WorkflowHistoryService {
    private readonly logger;
    private readonly workflowHistoryRepository;
    private readonly workflowPublishHistoryRepository;
    private readonly workflowRepository;
    private readonly workflowFinderService;
    private readonly eventService;
    constructor(logger: Logger, workflowHistoryRepository: WorkflowHistoryRepository, workflowPublishHistoryRepository: WorkflowPublishHistoryRepository, workflowRepository: WorkflowRepository, workflowFinderService: WorkflowFinderService, eventService: EventService);
    getList(user: User, workflowId: string, take: number, skip: number): Promise<Array<Omit<WorkflowHistory, 'nodes' | 'connections' | 'nodeGroups'>>>;
    getVersion(user: User, workflowId: string, versionId: string, settings?: {
        publishHistory?: PublishHistoryScope;
    }): Promise<WorkflowHistory>;
    findVersion(workflowId: string, versionId: string): Promise<WorkflowHistory | null>;
    snapshotCurrent(workflowId: string): Promise<{
        versionId: string;
    }>;
    saveVersion(user: User | string, workflow: WorkflowHistoryVersionInput['workflow'], workflowId: string, autosaved?: boolean, source?: WorkflowActionSource, transactionManager?: EntityManager, versionMetadata?: WorkflowHistoryVersionInput['versionMetadata'], { ctx, propagateErrors }?: {
        ctx?: OperationContext;
        propagateErrors?: boolean;
    }): Promise<void>;
    private createVersionRecord;
    updateVersionForUser(user: User, workflowId: string, versionId: string, updateData: UpdateWorkflowHistoryVersionDto): Promise<void>;
    updateVersion(workflowId: string, versionId: string, updateData: Omit<Partial<WorkflowHistory>, 'versionId' | 'workflowId' | 'createdAt' | 'updatedAt'>): Promise<void>;
    getVersionsByIds(user: User, workflowId: string, versionIds: string[]): Promise<Array<{
        versionId: string;
        createdAt: Date;
    }>>;
    getPublishTimeline(user: User, workflowId: string, page: {
        offset: number;
        limit: number;
    }): Promise<{
        id: number;
        workflowId: string;
        versionId: string | null;
        event: "activated" | "deactivated";
        createdAt: Date;
        user: User | null;
        versionName: string | null;
    }[]>;
}
export {};
