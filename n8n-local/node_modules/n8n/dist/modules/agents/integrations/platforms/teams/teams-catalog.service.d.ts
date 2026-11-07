import type { AgentTeamsIntegrationSettings, TeamsCatalogState } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { Logger } from '@n8n/backend-common';
import { CredentialsFinderService } from '@n8n/backend-services';
import { CredentialsService } from '../../../../../credentials/credentials.service';
import { TeamsCredentialNotesService } from './teams-credential-notes.service';
import { TeamsGraphService } from './teams-graph.service';
import { TeamsManifestService } from './teams-manifest.service';
import { TeamsManagerTokenService } from './teams-manager-token.service';
import { TeamsSetupService } from './teams-setup.service';
export interface TeamsCatalogScope {
    user: User;
    projectId: string;
    agentId: string;
    managerCredentialId: string;
    credentialId?: string;
    teamsAppId?: string;
}
export interface PublishTeamsAppOptions extends TeamsCatalogScope {
    credentialId: string;
    settings?: AgentTeamsIntegrationSettings;
}
export declare class TeamsCatalogService {
    private readonly graph;
    private readonly tokens;
    private readonly setupService;
    private readonly manifestService;
    private readonly credentialsFinderService;
    private readonly credentialsService;
    private readonly logger;
    private readonly notes;
    constructor(graph: TeamsGraphService, tokens: TeamsManagerTokenService, setupService: TeamsSetupService, manifestService: TeamsManifestService, credentialsFinderService: CredentialsFinderService, credentialsService: CredentialsService, logger: Logger, notes: TeamsCredentialNotesService);
    publish(options: PublishTeamsAppOptions): Promise<TeamsCatalogState>;
    private publishToCatalog;
    private createdState;
    private publishOverConflict;
    getState(options: TeamsCatalogScope): Promise<TeamsCatalogState>;
    private rememberPublish;
    private rememberedPublish;
    private botCredential;
    private updateExistingApp;
    private awaitCatalogApp;
    private queryCatalog;
    private findCatalogApp;
    private toCatalogEntry;
    private readState;
    private isPermissionRefusal;
    private publishError;
    private graphToken;
    private managerCredential;
}
