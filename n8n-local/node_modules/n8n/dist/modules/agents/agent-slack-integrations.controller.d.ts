import { CreateSlackAgentAppDto, type CreateSlackAgentAppResponse, type CreateSlackManagerCredentialResponse, InstallSlackManagedAppDto, type InstallSlackManagedAppResponse, type SlackAgentAppManifestResponse, type SlackManagedAppSettings, type SlackManagedSetupState, UpdateSlackManagedAppSettingsDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Request, Response } from 'express';
import { SlackManagedSetupService } from './integrations/platforms/slack/slack-managed-setup.service';
import { SlackManualSetupService } from './integrations/platforms/slack/slack-manual-setup.service';
export declare class AgentSlackIntegrationsController {
    private readonly manualSetup;
    private readonly managedSetup;
    constructor(manualSetup: SlackManualSetupService, managedSetup: SlackManagedSetupService);
    createSlackApp(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: CreateSlackAgentAppDto): Promise<CreateSlackAgentAppResponse>;
    getSlackAppManifest(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<SlackAgentAppManifestResponse>;
    getManagedSlackSetup(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<SlackManagedSetupState>;
    createManagedSlackCredential(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<CreateSlackManagerCredentialResponse>;
    finalizeManagedSlackCredential(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, credentialId: string): Promise<void>;
    installManagedSlackApp(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: InstallSlackManagedAppDto): Promise<InstallSlackManagedAppResponse>;
    getManagedSlackAppSettings(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, credentialId: string): Promise<SlackManagedAppSettings>;
    updateManagedSlackAppSettings(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: UpdateSlackManagedAppSettingsDto): Promise<SlackManagedAppSettings>;
    handleSlackAppOAuthCallback(req: Request<{
        projectId: string;
        agentId: string;
    }, unknown, unknown, {
        code?: string;
        state?: string;
        error?: string;
        error_description?: string;
    }>, res: Response, agentId: string): Promise<void>;
}
