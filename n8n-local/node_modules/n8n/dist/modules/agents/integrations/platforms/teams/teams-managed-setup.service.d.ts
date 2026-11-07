import type { CreateTeamsManagerCredentialResponse, TeamsManagedSetupState } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { CredentialsFinderService } from '@n8n/backend-services';
import { CredentialsService } from '../../../../../credentials/credentials.service';
import { CredentialsOverwrites } from '../../../../../credentials-overwrites';
import { OauthService } from '../../../../../oauth/oauth.service';
import { NamingService } from '../../../../../services/naming.service';
export declare const TEAMS_MANAGER_CREDENTIAL_TYPE = "microsoftTeamsManagerOAuth2Api";
export declare const REQUIRED_MANAGER_SCOPES: readonly ['https://graph.microsoft.com/Application.ReadWrite.All', 'https://graph.microsoft.com/AppCatalog.ReadWrite.All', 'https://graph.microsoft.com/AppCatalog.Submit'];
export interface TeamsManagedSetupScope {
    projectId: string;
    agentId: string;
    user: User;
}
export declare class TeamsManagedSetupService {
    private readonly credentialsService;
    private readonly credentialsFinderService;
    private readonly credentialsOverwrites;
    private readonly oauthService;
    private readonly namingService;
    constructor(credentialsService: CredentialsService, credentialsFinderService: CredentialsFinderService, credentialsOverwrites: CredentialsOverwrites, oauthService: OauthService, namingService: NamingService);
    isSetupAvailable(): boolean;
    assertSetupAvailable(): void;
    adminConsentUrl(): string | null;
    getSetupState(options: TeamsManagedSetupScope): Promise<TeamsManagedSetupState>;
    createManagerCredential(options: TeamsManagedSetupScope): Promise<CreateTeamsManagerCredentialResponse>;
    private summarizeGrant;
}
