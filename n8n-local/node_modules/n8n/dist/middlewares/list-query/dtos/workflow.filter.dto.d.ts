import { type WorkflowExecutionBlockCause } from '@n8n/api-types';
import { BaseFilter } from './base.filter.dto';
export declare class WorkflowFilter extends BaseFilter {
    ids?: string[];
    query?: string;
    active?: boolean;
    isArchived?: boolean;
    tags?: string[];
    projectId?: string;
    parentFolderId?: string;
    availableInMCP?: boolean;
    nodeTypes?: string[];
    triggerNodeTypes?: string[];
    executionBlockedBy?: WorkflowExecutionBlockCause[];
    static fromString(rawFilter: string): Promise<Record<string, any>>;
}
