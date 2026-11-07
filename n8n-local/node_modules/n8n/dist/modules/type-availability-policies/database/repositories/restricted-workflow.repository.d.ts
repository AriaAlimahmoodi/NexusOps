import { WorkflowDependency, type WorkflowIdsQuery } from '@n8n/db';
import { DataSource, Repository } from '@n8n/typeorm';
import { type RestrictedNodeTypes } from './restricted-node-type-match';
export declare class RestrictedWorkflowRepository extends Repository<WorkflowDependency> {
    constructor(dataSource: DataSource);
    findRunningNodeTypes(): Promise<string[]>;
    restrictedWorkflowIdsQuery(restricted: RestrictedNodeTypes): WorkflowIdsQuery;
}
