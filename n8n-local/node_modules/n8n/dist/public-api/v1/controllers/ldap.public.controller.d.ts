import { LdapConfigurationPublicDto, LdapSyncHistoryListPublicDto, LdapSyncHistoryPublicDto, ListLdapSyncHistoryQueryDto, RunLdapSyncPublicDto, UpdateLdapConfigurationPublicDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { LdapService } from '../../../modules/ldap.ee/ldap.service.ee';
export declare class LdapPublicController {
    private readonly ldapService;
    constructor(ldapService: LdapService);
    getLdapConfiguration(): Promise<LdapConfigurationPublicDto>;
    updateLdapConfiguration(_req: AuthenticatedRequest, _res: Response, body: UpdateLdapConfigurationPublicDto): Promise<LdapConfigurationPublicDto>;
    getLdapSync(_req: AuthenticatedRequest, _res: Response, query: ListLdapSyncHistoryQueryDto): Promise<LdapSyncHistoryListPublicDto>;
    runLdapSync(_req: AuthenticatedRequest, _res: Response, body: RunLdapSyncPublicDto): Promise<LdapSyncHistoryPublicDto>;
    private runSync;
}
