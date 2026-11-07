import { ChatIntegrationRegistry } from './agent-chat-integration';
import { ChatIntegrationService } from './chat-integration.service';
import type { IntegrationContextQueryExecutor, IntegrationContextQueryParams } from './integration-tools';
import { ChannelRateLimitGuard } from './channel-rate-limit.guard';
export declare class ChatIntegrationContextQueryExecutor implements IntegrationContextQueryExecutor {
    private readonly chatIntegrationService;
    private readonly integrationRegistry;
    private readonly channelRateLimitGuard;
    constructor(chatIntegrationService: ChatIntegrationService, integrationRegistry: ChatIntegrationRegistry, channelRateLimitGuard: ChannelRateLimitGuard);
    execute(params: IntegrationContextQueryParams): Promise<unknown>;
}
export { normalizeLinearComment, normalizeLinearIssue } from './platforms/linear-operations';
