import type { Project, User } from '@n8n/db';
import type { RemoteResourceOwner } from './resource-owner';
export declare class SourceControlContext {
    readonly user: User;
    readonly authorizedProjects: Project[];
    readonly accessibleWorkflowIds: string[];
    private readonly _hasAccessToAllProjects;
    private readonly authorizedProjectIds;
    private readonly authorizedProjectsByTeamId;
    private readonly authorizedProjectsByOwnerEmail;
    constructor(user: User, authorizedProjects: Project[], accessibleWorkflowIds: string[]);
    hasAccessToAllProjects(): boolean;
    canAccessProject(projectId: string): boolean;
    findAuthorizedProjectByOwner(owner: RemoteResourceOwner): Project | undefined;
}
