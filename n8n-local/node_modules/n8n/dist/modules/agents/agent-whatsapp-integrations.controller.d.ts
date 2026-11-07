import type { WhatsAppCredentialCheck, WhatsAppWebhookStatus } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { WhatsAppCredentialCheckService } from './integrations/platforms/whatsapp/whatsapp-credential-check.service';
import { WhatsAppWebhookVerificationStore } from './integrations/platforms/whatsapp/whatsapp-webhook-verification.store';
import { AgentRepository } from './repositories/agent.repository';
export declare class AgentWhatsAppIntegrationsController {
    private readonly credentialCheckService;
    private readonly webhookVerification;
    private readonly agentRepository;
    constructor(credentialCheckService: WhatsAppCredentialCheckService, webhookVerification: WhatsAppWebhookVerificationStore, agentRepository: AgentRepository);
    checkCredential(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, credentialId: string): Promise<WhatsAppCredentialCheck>;
    webhookStatus(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<WhatsAppWebhookStatus>;
    resetWebhookStatus(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, agentId: string): Promise<WhatsAppWebhookStatus>;
    private assertAgentExists;
}
