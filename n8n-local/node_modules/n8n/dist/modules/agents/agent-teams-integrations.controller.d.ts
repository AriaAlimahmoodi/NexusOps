import { AgentTeamsPackageDto, AgentTeamsProvisionAppDto, AgentTeamsProvisionBotDto, AgentTeamsPublishDto } from '@n8n/api-types';
import type { CreateTeamsManagerCredentialResponse, TeamsAgentSetupState, TeamsCredentialCheck, TeamsFileAccessCheck, TeamsManagedSetupState, TeamsAzureSubscription, TeamsCatalogState, TeamsProvisionedAppSummary, TeamsProvisionedBotSummary } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Request, Response } from 'express';
import { TeamsCredentialCheckService } from './integrations/platforms/teams/teams-credential-check.service';
import { TeamsBotProvisioningService } from './integrations/platforms/teams/teams-bot-provisioning.service';
import { TeamsCatalogService } from './integrations/platforms/teams/teams-catalog.service';
import { TeamsCredentialNotesService } from './integrations/platforms/teams/teams-credential-notes.service';
import { TeamsEntraProvisioningService } from './integrations/platforms/teams/teams-entra-provisioning.service';
import { TeamsSetupTelemetryService } from './integrations/platforms/teams/teams-setup-telemetry.service';
import { TeamsManagedSetupService } from './integrations/platforms/teams/teams-managed-setup.service';
import { TeamsSetupService } from './integrations/platforms/teams/teams-setup.service';
export declare class AgentTeamsIntegrationsController {
    private readonly setupService;
    private readonly credentialCheckService;
    private readonly managedSetupService;
    private readonly entraProvisioningService;
    private readonly botProvisioningService;
    private readonly catalogService;
    private readonly setupTelemetry;
    private readonly credentialNotes;
    constructor(setupService: TeamsSetupService, credentialCheckService: TeamsCredentialCheckService, managedSetupService: TeamsManagedSetupService, entraProvisioningService: TeamsEntraProvisioningService, botProvisioningService: TeamsBotProvisioningService, catalogService: TeamsCatalogService, setupTelemetry: TeamsSetupTelemetryService, credentialNotes: TeamsCredentialNotesService);
    publishApp(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: AgentTeamsPublishDto): Promise<TeamsCatalogState>;
    getCatalogState(req: AuthenticatedRequest<{
        projectId: string;
    }, {}, {}, {
        managerCredentialId?: string;
        credentialId?: string;
    }>, _res: Response, agentId: string): Promise<TeamsCatalogState>;
    listAzureSubscriptions(req: AuthenticatedRequest<{
        projectId: string;
    }, {}, {}, {
        managerCredentialId?: string;
    }>, _res: Response, _agentId: string): Promise<TeamsAzureSubscription[]>;
    reportManualBotRoute(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): void;
    provisionBot(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: AgentTeamsProvisionBotDto): Promise<TeamsProvisionedBotSummary>;
    provisionApp(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: AgentTeamsProvisionAppDto): Promise<TeamsProvisionedAppSummary>;
    getManagedSetupState(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<TeamsManagedSetupState>;
    createManagerCredential(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<CreateTeamsManagerCredentialResponse>;
    checkCredential(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, credentialId: string): Promise<TeamsCredentialCheck>;
    checkFileAccess(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, credentialId: string): Promise<TeamsFileAccessCheck>;
    getSetupState(req: AuthenticatedRequest<{
        projectId: string;
    }, {}, {}, {
        credentialId?: string;
    }>, _res: Response, agentId: string): Promise<TeamsAgentSetupState>;
    downloadPackage(req: AuthenticatedRequest<{
        projectId: string;
    }>, res: Response, agentId: string, payload: AgentTeamsPackageDto): Promise<void>;
    armTemplatePreflight(_req: Request, res: Response): void;
    getArmTemplate(req: Request<{
        projectId: string;
    }>, res: Response, agentId: string): Promise<void>;
}
