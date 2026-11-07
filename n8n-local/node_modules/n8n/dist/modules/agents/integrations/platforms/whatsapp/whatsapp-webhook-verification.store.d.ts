import { Logger } from '@n8n/backend-common';
import { CacheService } from '@n8n/backend-services';
export declare class WhatsAppWebhookVerificationStore {
    private readonly cacheService;
    private readonly logger;
    constructor(cacheService: CacheService, logger: Logger);
    markVerified(agentId: string): Promise<void>;
    clear(agentId: string): Promise<void>;
    reset(agentId: string): Promise<void>;
    isVerified(agentId: string): Promise<boolean>;
}
