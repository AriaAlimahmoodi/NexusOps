import type { AgentActor, SlackAgentAppManifest } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import type { User } from '@n8n/db';
import { Cipher } from 'n8n-core';
import { CredentialsService } from '../../../../../credentials/credentials.service';
import { BadRequestError } from '@n8n/errors';
import { CacheService, UrlService } from '@n8n/backend-services';
import { type SlackAppSetupSession } from './slack-setup.types';
import { AgentIntegrationManagementService } from '../../../agent-integration-management.service';
import type { ProjectAgent } from '../../../entities/agent.entity';
import { AgentRepository } from '../../../repositories/agent.repository';
export declare class SlackMethodsService {
    private readonly credentialsService;
    private readonly agentRepository;
    private readonly integrationManagementService;
    private readonly urlService;
    private readonly outboundHttp;
    private readonly cacheService;
    private readonly cipher;
    private readonly logger;
    constructor(credentialsService: CredentialsService, agentRepository: AgentRepository, integrationManagementService: AgentIntegrationManagementService, urlService: UrlService, outboundHttp: OutboundHttp, cacheService: CacheService, cipher: Cipher, logger: Logger);
    callSlackApi<T extends {
        [key: string]: unknown;
    }>(method: string, params: Record<string, string> | FormData, headers?: Record<string, string>): Promise<({
        ok: true;
    } & T) | {
        ok: false;
        error: string;
    }>;
    slackError(action: string, response: Record<string, unknown>): BadRequestError;
    getAgent(agentId: string, projectId: string): Promise<ProjectAgent>;
    buildManifest(agentName: string, projectId: string, agentId: string, options?: {
        redirectUrl?: string;
        managed?: boolean;
    }): SlackAgentAppManifest;
    callbackUrl(projectId: string, agentId: string): string;
    installUrl(oauthAuthorizeUrl: string, state: string, redirectUrl: string): string;
    storeSession(state: string, session: SlackAppSetupSession): Promise<void>;
    decodeSession(value: string): Promise<SlackAppSetupSession | undefined>;
    connectBotCredential(agent: ProjectAgent, user: User, accessToken: string, session: SlackAppSetupSession, modifiedBy?: AgentActor): Promise<string>;
    private deleteUnreferencedCredential;
    private clearManagedAppSession;
    webhookUrl(projectId: string, agentId: string): string;
    private managedAppUrl;
    private credentialName;
    private sanitiseSlackAppName;
}
