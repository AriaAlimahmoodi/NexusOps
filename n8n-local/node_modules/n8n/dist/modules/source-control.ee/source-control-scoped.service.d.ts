import { WorkflowRepository } from '@n8n/db';
import { type AuthenticatedRequest, type CredentialsEntity, type Folder, type Project, type WorkflowEntity, type WorkflowTagMapping } from '@n8n/db';
import type { FindOptionsWhere } from '@n8n/typeorm';
import type { DataTable } from '../../modules/data-table/data-table.entity';
import { SourceControlContextFactory } from './source-control-context.factory';
import { SourceControlContext } from './types/source-control-context';
export declare class SourceControlScopedService {
    private readonly sourceControlContextFactory;
    private readonly workflowRepository;
    constructor(sourceControlContextFactory: SourceControlContextFactory, workflowRepository: WorkflowRepository);
    ensureIsAllowedToPush(req: AuthenticatedRequest): Promise<void>;
    ensureIsAllowedToGetStatus(req: AuthenticatedRequest): Promise<void>;
    getWorkflowsInAdminProjectsFromContext(context: SourceControlContext, id?: string): Promise<WorkflowEntity[] | undefined>;
    getProjectsWithPushScopeByContextFilter(context: SourceControlContext): FindOptionsWhere<Project> | undefined;
    getFoldersInAdminProjectsFromContextFilter(context: SourceControlContext): FindOptionsWhere<Folder>;
    getWorkflowsInAdminProjectsFromContextFilter(context: SourceControlContext): FindOptionsWhere<WorkflowEntity>;
    getCredentialsInAdminProjectsFromContextFilter(context: SourceControlContext): FindOptionsWhere<CredentialsEntity>;
    getWorkflowTagMappingInAdminProjectsFromContextFilter(context: SourceControlContext): FindOptionsWhere<WorkflowTagMapping>;
    getDataTablesInAdminProjectsFromContextFilter(context: SourceControlContext): FindOptionsWhere<DataTable>;
}
