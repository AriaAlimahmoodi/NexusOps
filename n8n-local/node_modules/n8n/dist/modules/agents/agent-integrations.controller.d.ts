import { AgentConnectIntegrationDto, AgentDisconnectIntegrationDto, type AgentDisconnectIntegrationResponse, type AgentIntegrationConnectResponse, type AgentIntegrationStatusResponse, type AgentWhatsAppVerifyTokenResponse } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Request, Response } from 'express';
import { InstanceSettings } from 'n8n-core';
import { AgentIntegrationManagementService } from './agent-integration-management.service';
import { AgentChannelStatusReporter } from './integrations/agent-channel-status-reporter';
import { ChatIntegrationRegistry } from './integrations/agent-chat-integration';
import { ChatIntegrationService } from './integrations/chat-integration.service';
import { AgentChannelStatusRepository } from './repositories/agent-channel-status.repository';
import { AgentRepository } from './repositories/agent.repository';
import { CollaborationService } from '../../collaboration/collaboration.service';
export declare class AgentIntegrationsController {
    private readonly integrationManagementService;
    private readonly chatIntegrationService;
    private readonly agentRepository;
    private readonly chatIntegrationRegistry;
    private readonly channelStatusRepository;
    private readonly statusReporter;
    private readonly instanceSettings;
    private readonly collaborationService;
    constructor(integrationManagementService: AgentIntegrationManagementService, chatIntegrationService: ChatIntegrationService, agentRepository: AgentRepository, chatIntegrationRegistry: ChatIntegrationRegistry, channelStatusRepository: AgentChannelStatusRepository, statusReporter: AgentChannelStatusReporter, instanceSettings: InstanceSettings, collaborationService: CollaborationService);
    connectIntegration(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: AgentConnectIntegrationDto): Promise<AgentIntegrationConnectResponse>;
    disconnectIntegration(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string, payload: AgentDisconnectIntegrationDto): Promise<AgentDisconnectIntegrationResponse>;
    integrationStatus(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<AgentIntegrationStatusResponse>;
    whatsAppVerifyToken(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<AgentWhatsAppVerifyTokenResponse>;
    handleWebhookVerification(req: Request<{
        projectId: string;
        agentId: string;
        platform: string;
    }>, res: Response): Promise<void>;
    handleWebhook(req: Request<{
        projectId: string;
        agentId: string;
        platform: string;
    }>, res: Response): Promise<void>;
}
