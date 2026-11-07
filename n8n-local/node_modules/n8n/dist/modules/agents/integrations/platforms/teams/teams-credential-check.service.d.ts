import type { TeamsCredentialCheck, TeamsFileAccessCheck } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import type { User } from '@n8n/db';
import { AgentCredentialLookupService } from '../../agent-credential-lookup.service';
export declare class TeamsCredentialCheckService {
    private readonly credentialLookup;
    private readonly outboundHttp;
    private readonly logger;
    constructor(credentialLookup: AgentCredentialLookupService, outboundHttp: OutboundHttp, logger: Logger);
    check(user: User, projectId: string, credentialId: string): Promise<TeamsCredentialCheck>;
    checkFileAccess(user: User, projectId: string, credentialId: string): Promise<TeamsFileAccessCheck>;
    private requestToken;
}
