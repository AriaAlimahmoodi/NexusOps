import { AgentIntegrationConfig } from '@n8n/api-types';
import type { RichCardComponentType } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import type { Thread, Author } from 'chat';
import { InstanceSettings } from 'n8n-core';
import { UrlService } from '@n8n/backend-services';
import { AgentRepository } from '../../repositories/agent.repository';
import { AgentChatIntegration, type AgentChannelPreconditionContext, type AgentChatIntegrationContext, type ActionDecisionMessageParams, type BridgeExecutionContext, type BridgeMessageContextParams, type BridgeResumeExecutionContext } from '../agent-chat-integration';
import type { SuspendComponent } from '../component-mapper';
export declare class TelegramIntegration extends AgentChatIntegration {
    private readonly logger;
    private readonly urlService;
    private readonly agentRepository;
    private readonly instanceSettings;
    private readonly outboundHttp;
    readonly type = "telegram";
    readonly credentialTypes: string[];
    readonly displayLabel = "Telegram";
    readonly displayIcon = "telegram";
    readonly builderGuidance: {
        capabilities: string[];
        useIntegrationWhen: string[];
        useNodeToolWhen: string[];
    };
    readonly supportedComponents: readonly RichCardComponentType[];
    readonly actionToolDefinitions: import("../integration-tool-types").IntegrationActionDefinition[];
    readonly contextToolGuidance: string[];
    readonly actionToolGuidance: string[];
    readonly needsShortCallbackData = true;
    readonly deleteActionMessageBeforeResume = false;
    readonly disableStreaming = true;
    formatActionDecisionMessage({ approved, selectedLabel, raw, user, }: ActionDecisionMessageParams): string;
    readonly formatThreadId: {
        fromSdk: (thread: Thread<unknown, unknown>) => string;
        toSdk: (threadId: string) => string;
    };
    constructor(logger: Logger, urlService: UrlService, agentRepository: AgentRepository, instanceSettings: InstanceSettings, outboundHttp: OutboundHttp);
    createAdapter(ctx: AgentChatIntegrationContext): Promise<unknown>;
    validateConfig(integration: AgentIntegrationConfig): void;
    requiresLeader({ ingressEnabled }?: {
        ingressEnabled: boolean;
    }): boolean;
    assertStartupPreconditions(ctx: AgentChannelPreconditionContext): Promise<void>;
    onBeforeConnect(ctx: AgentChatIntegrationContext): Promise<void>;
    onAfterConnect(ctx: AgentChatIntegrationContext): Promise<void>;
    onBeforeDisconnect(ctx: AgentChatIntegrationContext): Promise<void>;
    isUserAllowed(author: Author, integration: AgentIntegrationConfig | undefined): boolean;
    createBridgeExecutionContext(params: BridgeMessageContextParams): Promise<BridgeExecutionContext>;
    createResumeExecutionContext(params: {
        thread: BridgeMessageContextParams['thread'];
        logger: BridgeMessageContextParams['logger'];
        agentId: string;
    }): Promise<BridgeResumeExecutionContext>;
    normalizeComponents(components: SuspendComponent[]): SuspendComponent[];
    private getMode;
    private deriveSecretToken;
    private extractBotToken;
    private botApiUrl;
    private botApiRequest;
    private isOkStatus;
    private stringifyBody;
}
