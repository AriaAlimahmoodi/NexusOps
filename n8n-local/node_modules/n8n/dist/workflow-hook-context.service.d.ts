import { TagRepository } from '@n8n/db';
import { NodeTypes } from './node-types';
export declare class WorkflowHookContextService {
    private readonly tagRepository;
    private readonly nodeTypes;
    constructor(tagRepository: TagRepository, nodeTypes: NodeTypes);
    getWorkflowTags(workflowId: string): Promise<string[]>;
    resolveIsTriggerNodeType(type: string, typeVersion?: number): boolean;
}
