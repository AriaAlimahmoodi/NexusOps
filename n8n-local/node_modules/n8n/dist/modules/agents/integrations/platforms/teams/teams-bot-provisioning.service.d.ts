import type { TeamsAzureSubscription, TeamsProvisionedBotSummary } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { CredentialsFinderService } from '@n8n/backend-services';
import { TeamsArmService } from './teams-arm.service';
import { TeamsArmTemplateService } from './teams-arm-template.service';
import { TeamsCredentialNotesService } from './teams-credential-notes.service';
import { TeamsManagerTokenService } from './teams-manager-token.service';
export declare function botResourceId(subscriptionId: string, botName: string): string;
export interface ListSubscriptionsOptions {
    user: User;
    managerCredentialId: string;
}
export interface ProvisionBotOptions extends ListSubscriptionsOptions {
    projectId: string;
    agentId: string;
    agentName: string;
    credentialId: string;
    subscriptionId: string;
    msaAppId: string;
    msaAppTenantId: string;
    messagingEndpoint: string;
}
export declare class TeamsBotProvisioningService {
    private readonly arm;
    private readonly tokens;
    private readonly armTemplateService;
    private readonly credentialsFinderService;
    private readonly notes;
    constructor(arm: TeamsArmService, tokens: TeamsManagerTokenService, armTemplateService: TeamsArmTemplateService, credentialsFinderService: CredentialsFinderService, notes: TeamsCredentialNotesService);
    listSubscriptions(options: ListSubscriptionsOptions): Promise<TeamsAzureSubscription[]>;
    provisionBot(options: ProvisionBotOptions): Promise<TeamsProvisionedBotSummary>;
    private findBotByAppId;
    private registerProvider;
    private ensureResourceGroup;
    private subscriptionsError;
    private botError;
    private azureToken;
    private managerCredential;
}
