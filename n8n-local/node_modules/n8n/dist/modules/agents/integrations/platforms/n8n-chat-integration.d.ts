import type { RichCardComponentType } from '@n8n/api-types';
import { UserRepository } from '@n8n/db';
import { AgentChatIntegration, type PlatformActionParams, type PlatformContextQueryParams } from '../agent-chat-integration';
import type { IntegrationActionResult } from '../integration-tools';
export declare class N8nChatIntegration extends AgentChatIntegration {
    private readonly userRepository;
    readonly type: "n8n_chat";
    readonly credentialTypes: string[];
    readonly displayLabel = "n8n Chat";
    readonly displayIcon = "message-square";
    readonly internal = true;
    readonly requiresChatInstance = false;
    readonly builderGuidance: {
        capabilities: string[];
        useIntegrationWhen: string[];
        useNodeToolWhen: string[];
    };
    readonly supportedComponents: readonly RichCardComponentType[];
    readonly contextToolDefinitions: import("../integration-tool-types").IntegrationContextQueryDefinition[];
    readonly actionToolDefinitions: import("../integration-tool-types").IntegrationActionDefinition[];
    readonly actionToolGuidance: string[];
    constructor(userRepository: UserRepository);
    createAdapter(): Promise<unknown>;
    executeAction(params: PlatformActionParams): Promise<IntegrationActionResult | undefined>;
    executeContextQuery(params: PlatformContextQueryParams): Promise<unknown>;
}
