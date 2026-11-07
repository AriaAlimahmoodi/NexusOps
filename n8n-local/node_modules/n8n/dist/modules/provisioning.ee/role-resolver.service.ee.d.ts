import { Logger } from '@n8n/backend-common';
import { type OperationContext, ProjectRepository } from '@n8n/db';
import type { ResolvedRoles, RoleMappingConfig, RoleResolverContext } from './role-resolver-types';
export declare class RoleResolverService {
    private readonly logger;
    private readonly projectRepository;
    constructor(logger: Logger, projectRepository: ProjectRepository);
    resolveRoles(config: RoleMappingConfig, context: RoleResolverContext, ctx?: OperationContext): Promise<ResolvedRoles>;
    private collectProjectInfoForRules;
    private resolveInstanceRole;
    private resolveProjectRoles;
    private evaluateExpression;
}
