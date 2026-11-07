import { ProjectRepository, WorkflowRepository } from '@n8n/db';
import type { User } from '@n8n/db';
import { SourceControlContext } from './types/source-control-context';
export declare class SourceControlContextFactory {
    private readonly projectRepository;
    private readonly workflowRepository;
    constructor(projectRepository: ProjectRepository, workflowRepository: WorkflowRepository);
    createContext(user: User): Promise<SourceControlContext>;
    private fetchAllProjects;
    private fetchAuthorizedProjects;
    private fetchAccessibleWorkflowIds;
}
