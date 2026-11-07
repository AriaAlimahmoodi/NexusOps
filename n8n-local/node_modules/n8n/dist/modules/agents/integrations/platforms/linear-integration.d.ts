import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { AgentChatIntegration, type AgentChatIntegrationContext, type PlatformActionParams, type PlatformContextQueryParams } from '../agent-chat-integration';
import type { IntegrationActionResult } from '../integration-tools';
export declare class LinearIntegration extends AgentChatIntegration {
    private readonly logger;
    private readonly outboundHttp;
    readonly type = "linear";
    readonly credentialTypes: string[];
    readonly displayLabel = "Linear";
    readonly displayIcon = "linear";
    readonly builderGuidance: {
        capabilities: string[];
        useIntegrationWhen: string[];
        useNodeToolWhen: string[];
    };
    readonly contextToolDefinitions: import("../integration-tool-types").IntegrationContextQueryDefinition[];
    readonly actionToolDefinitions: import("../integration-tool-types").IntegrationActionDefinition[];
    constructor(logger: Logger, outboundHttp: OutboundHttp);
    executeContextQuery(params: PlatformContextQueryParams): Promise<unknown>;
    executeAction(params: PlatformActionParams): Promise<IntegrationActionResult | undefined>;
    createAdapter(ctx: AgentChatIntegrationContext): Promise<unknown>;
    private extractAccessToken;
    private extractSigningSecret;
    private extractMode;
    private fetchDisplayName;
}
