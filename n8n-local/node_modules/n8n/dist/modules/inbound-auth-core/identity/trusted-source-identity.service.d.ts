import { Logger } from '@n8n/backend-common';
import { EventService, RoleService } from '@n8n/backend-services';
import { RoleMappingProxyService } from '@n8n/backend-services/auth';
import { TransactionRunner, UserRepository } from '@n8n/db';
import { IdentityService, type Result, type Verified } from '@n8n/inbound-auth';
import { type SecurityContext } from '@n8n/permissions';
import { TrustedSourceIdentityRepository } from '../database/repositories/trusted-source-identity.repository';
export declare class TrustedSourceIdentityService extends IdentityService {
    private readonly logger;
    private readonly identities;
    private readonly users;
    private readonly txRunner;
    private readonly eventService;
    private readonly roleService;
    private readonly roleMapping;
    constructor(logger: Logger, identities: TrustedSourceIdentityRepository, users: UserRepository, txRunner: TransactionRunner, eventService: EventService, roleService: RoleService, roleMapping: RoleMappingProxyService);
    private mapRoles;
    private mapIfContinuous;
    private resolveByUserId;
    private acceptBinding;
    private link;
    private provision;
    private isAssignableInstanceRole;
    private linkOrProvision;
    private resolveBinding;
    identify(verified: Verified): Promise<Result<SecurityContext>>;
}
