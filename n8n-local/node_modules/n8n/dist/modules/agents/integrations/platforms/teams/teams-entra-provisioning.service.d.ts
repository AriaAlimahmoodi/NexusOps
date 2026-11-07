import type { TeamsProvisionedAppSummary } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { CredentialsFinderService, UrlService } from '@n8n/backend-services';
import { CredentialsService } from '../../../../../credentials/credentials.service';
import { TeamsGraphService } from './teams-graph.service';
import { TeamsManagerTokenService } from './teams-manager-token.service';
export declare const BOT_CREDENTIAL_TYPE = "microsoftEntraServicePrincipalApi";
export interface ProvisionEntraAppOptions {
    user: User;
    projectId: string;
    agentId: string;
    agentName: string;
    managerCredentialId: string;
}
export declare class TeamsEntraProvisioningService {
    private readonly graph;
    private readonly tokens;
    private readonly credentialsService;
    private readonly credentialsFinderService;
    private readonly urlService;
    constructor(graph: TeamsGraphService, tokens: TeamsManagerTokenService, credentialsService: CredentialsService, credentialsFinderService: CredentialsFinderService, urlService: UrlService);
    provision(options: ProvisionEntraAppOptions): Promise<TeamsProvisionedAppSummary>;
    private managerCredential;
    private readTenant;
    private rememberTenant;
    private createApp;
    private findAppByUniqueName;
    private declareFileAccess;
    private mergeFileAccess;
    private dropExpiredSecrets;
    private addSecret;
    private createServicePrincipal;
    private registrationError;
    private findProvisionedCredential;
    private writeBotCredential;
}
