import { EventService } from '@n8n/backend-services';
import { LdapService } from './ldap.service.ee';
import { LdapConfiguration } from './types';
export declare class LdapController {
    private readonly ldapService;
    private readonly eventService;
    constructor(ldapService: LdapService, eventService: EventService);
    getConfig(): Promise<import("@n8n/constants").LdapConfig>;
    testConnection(): Promise<void>;
    updateConfig(req: LdapConfiguration.Update): Promise<import("@n8n/constants").LdapConfig>;
    getLdapSync(req: LdapConfiguration.GetSync): Promise<import("@n8n/db").AuthProviderSyncHistory[]>;
    syncLdap(req: LdapConfiguration.Sync): Promise<void>;
}
