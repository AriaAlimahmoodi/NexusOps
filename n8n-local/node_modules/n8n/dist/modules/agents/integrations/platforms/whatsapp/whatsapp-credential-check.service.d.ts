import type { WhatsAppCredentialCheck } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { AgentsConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import { AgentCredentialLookupService } from '../../agent-credential-lookup.service';
export declare class WhatsAppCredentialCheckService {
    private readonly credentialLookup;
    private readonly outboundHttp;
    private readonly logger;
    private readonly agentsConfig;
    constructor(credentialLookup: AgentCredentialLookupService, outboundHttp: OutboundHttp, logger: Logger, agentsConfig: AgentsConfig);
    check(user: User, projectId: string, credentialId: string): Promise<WhatsAppCredentialCheck>;
    private tokenExpiry;
    private refused;
    private get;
}
