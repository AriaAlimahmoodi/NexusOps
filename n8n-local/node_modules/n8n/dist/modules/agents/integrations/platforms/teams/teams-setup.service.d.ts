import type { AgentTeamsIntegrationSettings, TeamsAgentSetupState } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { UrlService } from '@n8n/backend-services';
import { TeamsArmTemplateService } from './teams-arm-template.service';
import { TeamsManifestService } from './teams-manifest.service';
import { AgentRepository } from '../../../repositories/agent.repository';
import { AgentCredentialLookupService } from '../../agent-credential-lookup.service';
interface AgentScope {
    projectId: string;
    agentId: string;
}
export declare class TeamsSetupService {
    private readonly agentRepository;
    private readonly credentialLookup;
    private readonly manifestService;
    private readonly armTemplateService;
    private readonly urlService;
    constructor(agentRepository: AgentRepository, credentialLookup: AgentCredentialLookupService, manifestService: TeamsManifestService, armTemplateService: TeamsArmTemplateService, urlService: UrlService);
    getSetupState(user: User, scope: AgentScope, selectedCredentialId?: string): Promise<TeamsAgentSetupState>;
    buildPackage(user: User, scope: AgentScope, selectedCredentialId?: string, selectedSettings?: AgentTeamsIntegrationSettings): Promise<{
        archive: Buffer;
        fingerprint: string;
        credentialId: string;
    }>;
    buildArmTemplate(scope: AgentScope & {
        token: string;
        credentialId: string;
    }): Promise<Record<string, unknown>>;
    private credentialClaimedBy;
    private teamsSettingsOf;
    private defaultIdentity;
    agentNameFor(projectId: string, agentId: string): Promise<string>;
    botIdentityFor(user: User, scope: AgentScope, credentialId: string): Promise<{
        clientId: string;
        tenantId: string;
        messagingEndpoint: string;
        agentName: string;
    }>;
    private getAgent;
    private connectedCredentialId;
    private readIdentity;
    private appOutdated;
    private azureBot;
    private fileAccessConsentUrl;
    private messagingEndpointUrl;
}
export {};
