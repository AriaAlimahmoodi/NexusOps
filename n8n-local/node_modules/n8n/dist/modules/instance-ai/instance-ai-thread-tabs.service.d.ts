import { type InstanceAiThreadTabsState } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { WorkflowRepository } from '@n8n/db';
import type { InstanceAiChangedArtifact } from '@n8n/instance-ai';
import { DataTableRepository } from '../../modules/data-table/data-table.repository';
import { InstanceAiThreadTabsRepository } from './repositories/instance-ai-thread-tabs.repository';
export declare function withShownTab(stored: InstanceAiThreadTabsState | null, tab: InstanceAiChangedArtifact): InstanceAiThreadTabsState | null;
export declare class InstanceAiThreadTabsService {
    private readonly logger;
    private readonly threadTabsRepository;
    private readonly workflowRepository;
    private readonly dataTableRepository;
    constructor(logger: Logger, threadTabsRepository: InstanceAiThreadTabsRepository, workflowRepository: WorkflowRepository, dataTableRepository: DataTableRepository);
    getState(threadId: string, userId: string): Promise<InstanceAiThreadTabsState | null>;
    saveState(threadId: string, userId: string, state: InstanceAiThreadTabsState): Promise<void>;
    showArtifactTab(threadId: string, userId: string, artifact: InstanceAiChangedArtifact): Promise<void>;
    private withCurrentName;
    private parseStored;
}
