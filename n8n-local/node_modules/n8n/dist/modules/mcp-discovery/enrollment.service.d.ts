import { GlobalConfig } from '@n8n/config';
import { ApiKeyRepository, SettingsRepository } from '@n8n/db';
import type { User } from '@n8n/db';
import { UserConsentRepository } from '../../modules/oauth-server/database/repositories/oauth-user-consent.repository';
import { McpDiscoveryActivityEvents } from './activity-events.service';
import type { McpDiscoveryVisitRequestDto } from './mcp-discovery.dto';
import type { McpDiscoveryState } from './types';
export declare class McpDiscoveryEnrollmentService {
    private readonly settings;
    private readonly config;
    private readonly consents;
    private readonly apiKeys;
    private readonly activityEvents;
    constructor(settings: SettingsRepository, config: GlobalConfig, consents: UserConsentRepository, apiKeys: ApiKeyRepository, activityEvents: McpDiscoveryActivityEvents);
    visit(user: Pick<User, 'id' | 'role'>, { pickedClaude, isTrial }?: McpDiscoveryVisitRequestDto): Promise<McpDiscoveryState>;
    private getMcpState;
    private readEligibilityTime;
    private parseTimestamp;
}
