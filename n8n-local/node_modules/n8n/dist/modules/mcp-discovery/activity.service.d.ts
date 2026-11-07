import { Logger } from '@n8n/backend-common';
import type { McpCallerAuth } from '@n8n/backend-services/auth';
import { GlobalConfig } from '@n8n/config';
import { SettingsRepository } from '@n8n/db';
export declare const isClaudeMcpClient: (name: string | undefined) => boolean;
export declare const discoveryUserKey: (userId: string, field: string) => string;
export declare class McpDiscoveryActivityService {
    private readonly settings;
    private readonly config;
    private readonly logger;
    constructor(settings: SettingsRepository, config: GlobalConfig, logger: Logger);
    recordClaudeConnection(userId: string, clientName?: string, caller?: McpCallerAuth): Promise<void>;
    recordFirstLogin(userId: string, loggedInAt: number): Promise<void>;
    recordMcpToolResult(userId: string, toolName: string, status: 'success' | 'error', workflowId?: string, appliedOperations?: number): Promise<void>;
    recordAssistantMutation(userId: string, changedAt?: number): Promise<void>;
}
