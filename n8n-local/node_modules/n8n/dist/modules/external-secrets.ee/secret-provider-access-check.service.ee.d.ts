import type { User } from '@n8n/db';
import { ProjectSecretsProviderAccessRepository, SecretsProviderConnectionRepository } from '@n8n/db';
import type { Scope } from '@n8n/permissions';
import { ProjectService } from '../../services/project.service.ee';
import { RoleService } from '@n8n/backend-services';
export declare class SecretsProviderAccessCheckService {
    private readonly connectionRepository;
    private readonly projectAccessRepository;
    private readonly roleService;
    private readonly projectService;
    constructor(connectionRepository: SecretsProviderConnectionRepository, projectAccessRepository: ProjectSecretsProviderAccessRepository, roleService: RoleService, projectService: ProjectService);
    isProviderAvailableInProject(providerKey: string, projectId: string): Promise<boolean>;
    assertConnectionAccess({ providerKey, projectId, requiredScope, user, }: {
        providerKey: string;
        projectId: string;
        requiredScope: Scope;
        user: User;
    }): Promise<void>;
    getConnectionScopesForProject(user: User, providerKey: string, projectId: string): Promise<Scope[]>;
}
