import { RoleMappingRuleRepository } from '@n8n/db';
import type { RoleDeletionChecker } from '@n8n/backend-services';
import { ProvisioningService } from './provisioning.service.ee';
export declare class ProvisioningRoleDeletionChecker implements RoleDeletionChecker {
    private readonly roleMappingRuleRepository;
    private readonly provisioningService;
    constructor(roleMappingRuleRepository: RoleMappingRuleRepository, provisioningService: ProvisioningService);
    findRoleDeletionBlockers(roleSlug: string): Promise<string[]>;
}
