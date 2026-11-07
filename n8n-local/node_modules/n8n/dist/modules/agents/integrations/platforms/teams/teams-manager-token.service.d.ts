import { OutboundHttp } from '@n8n/backend-network';
import { Logger } from '@n8n/backend-common';
import { type CredentialsEntity, CredentialsRepository } from '@n8n/db';
import { CredentialsService } from '../../../../../credentials/credentials.service';
import { CredentialsOverwrites } from '../../../../../credentials-overwrites';
export declare const GRAPH_RESOURCE = "https://graph.microsoft.com";
export declare const AZURE_RESOURCE = "https://management.azure.com";
export type ManagerResource = typeof GRAPH_RESOURCE | typeof AZURE_RESOURCE;
export declare const RESOURCE_SCOPES: Record<ManagerResource, string>;
export declare class TeamsManagerTokenService {
    private readonly credentialsService;
    private readonly credentialsRepository;
    private readonly credentialsOverwrites;
    private readonly outboundHttp;
    private readonly logger;
    constructor(credentialsService: CredentialsService, credentialsRepository: CredentialsRepository, credentialsOverwrites: CredentialsOverwrites, outboundHttp: OutboundHttp, logger: Logger);
    private readonly inFlight;
    acquire(credential: CredentialsEntity, resource: ManagerResource): Promise<string>;
    private redeem;
    private persistRotatedRefreshToken;
    private tokenDataOf;
    private clientCredentials;
}
