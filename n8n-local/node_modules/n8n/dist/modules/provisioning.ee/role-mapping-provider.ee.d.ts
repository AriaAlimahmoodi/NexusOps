import type { OperationContext, User } from '@n8n/db';
import type { ResolvedRoles, RoleMappingConfig, RoleMappingProvider, RoleResolverContext } from '@n8n/backend-services/auth';
import { ProvisioningService } from './provisioning.service.ee';
import { RoleResolverService } from './role-resolver.service.ee';
export declare class ProvisioningRoleMappingProvider implements RoleMappingProvider {
    private readonly roleResolver;
    private readonly provisioning;
    constructor(roleResolver: RoleResolverService, provisioning: ProvisioningService);
    resolveRoles(config: RoleMappingConfig, context: RoleResolverContext, ctx?: OperationContext): Promise<ResolvedRoles>;
    applyResolvedRoles(user: User, resolved: ResolvedRoles, managed: {
        instanceRole: boolean;
        projectRoles: boolean;
    }): Promise<void>;
}
