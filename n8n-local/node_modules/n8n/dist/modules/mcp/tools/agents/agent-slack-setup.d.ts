import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { SlackManagedSetupService } from '../../../../modules/agents/integrations/platforms/slack/slack-managed-setup.service';
import { SlackManualSetupService } from '../../../../modules/agents/integrations/platforms/slack/slack-manual-setup.service';
import type { ProjectAgent } from '../../../../modules/agents/entities/agent.entity';
export declare const SLACK_INTEGRATION_TYPE = "slack";
export declare class McpAgentSlackSetup {
    private readonly managedSetup;
    private readonly manualSetup;
    private readonly logger;
    constructor(managedSetup: SlackManagedSetupService, manualSetup: SlackManualSetupService, logger: Logger);
    describeSetup(agent: ProjectAgent, user: User, agentUrl: string): Promise<{
        ok: boolean;
        code: string;
        agentId: string;
        configured: boolean;
        error: string;
        agentUrl: string;
        slackApp: {
            requestUrl: string;
            manifest: import("@n8n/api-types").SlackAgentAppManifest;
        };
        nextStep: string;
        status?: undefined;
        managerCredentials?: undefined;
    } | {
        slackApp?: undefined;
        ok: boolean;
        code: string;
        agentId: string;
        configured: boolean;
        error: string;
        managerCredentials: {
            managerCredentialId: string;
            name: string;
        }[];
        agentUrl: string;
        nextStep: string;
        status?: undefined;
    } | {
        slackApp?: undefined;
        ok: boolean;
        code: string;
        agentId: string;
        configured: boolean;
        error: string;
        agentUrl: string;
        nextStep: string;
        status?: undefined;
        managerCredentials?: undefined;
    } | {
        error?: undefined;
        slackApp?: undefined;
        code?: undefined;
        agentUrl?: undefined;
        ok: boolean;
        status: string;
        agentId: string;
        configured: boolean;
        managerCredentials: {
            managerCredentialId: string;
            name: string;
            workspaces: {
                workspaceId: string;
                name: string;
                connected: boolean;
                credentialId?: string | undefined;
            }[];
        }[];
        nextStep: string;
    }>;
    install(agent: ProjectAgent, user: User, target: {
        managerCredentialId: string;
        workspaceId: string;
    }): Promise<import("@n8n/api-types").InstallSlackManagedAppResponse>;
    describeBotCredential(agent: ProjectAgent, user: User, credentialId: string): Promise<{
        slackApp: {
            configuredForAgent: boolean;
        };
        warning?: undefined;
    } | {
        slackApp: {
            configuredForAgent: boolean;
            requestUrl: string;
            manifest: import("@n8n/api-types").SlackAgentAppManifest;
        };
        warning: string;
    }>;
    isAppConfiguredForAgent(agent: ProjectAgent, user: User, credentialId: string): Promise<boolean>;
    private appRequirements;
}
