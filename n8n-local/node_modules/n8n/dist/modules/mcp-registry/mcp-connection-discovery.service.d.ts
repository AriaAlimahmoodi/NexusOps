import type { McpRegistryDiscoveryRequest, McpRegistryDiscoveryResponse } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { CredentialsFinderService } from '@n8n/backend-services';
import type { User } from '@n8n/db';
import { CredentialTypes } from '../../credential-types';
import { CredentialsHelper } from '../../credentials-helper';
import { OauthService } from '../../oauth/oauth.service';
import { McpRegistryService } from './registry/mcp-registry.service';
export declare class McpConnectionDiscoveryService {
    private readonly registryService;
    private readonly credentialsFinderService;
    private readonly credentialsHelper;
    private readonly credentialTypes;
    private readonly oauthService;
    private readonly outboundHttp;
    private readonly logger;
    constructor(logger: Logger, registryService: McpRegistryService, credentialsFinderService: CredentialsFinderService, credentialsHelper: CredentialsHelper, credentialTypes: CredentialTypes, oauthService: OauthService, outboundHttp: OutboundHttp);
    discover(user: User, request: McpRegistryDiscoveryRequest): Promise<McpRegistryDiscoveryResponse>;
    private prepareRegistrySource;
    private resolveCredential;
    private createCredentialFetch;
}
