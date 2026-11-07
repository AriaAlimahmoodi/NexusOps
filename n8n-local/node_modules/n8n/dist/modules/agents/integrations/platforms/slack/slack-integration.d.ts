import type { AgentIntegrationConfig, AgentIntegrationDisconnectWarning, RichCardComponentType } from '@n8n/api-types';
import type { Thread } from 'chat';
import { AgentRepository } from '../../../repositories/agent.repository';
import { AgentChatIntegration, type AgentChannelPreconditionContext, type AgentChatIntegrationContext, type AgentIntegrationRemovalContext, type BridgeExecutionContext, type BridgeMessageContextParams, type BridgeResumeExecutionContext, type PlatformAgentContext, type PlatformContextQueryParams, type UnauthenticatedWebhookContext, type UnauthenticatedWebhookResponse } from '../../agent-chat-integration';
import type { ChatInstance } from '../../chat-integration.service';
import type { ReplyExpectation } from '../../integration-tools';
import { type SlackThreadContext } from './slack-bridge-behavior';
export declare class SlackIntegration extends AgentChatIntegration {
    private readonly agentRepository;
    constructor(agentRepository: AgentRepository);
    readonly type = "slack";
    readonly credentialTypes: string[];
    readonly displayLabel = "Slack";
    readonly displayIcon = "slack";
    readonly builderGuidance: {
        capabilities: string[];
        useIntegrationWhen: string[];
        useNodeToolWhen: string[];
    };
    readonly supportedComponents: readonly RichCardComponentType[];
    readonly contextToolDefinitions: import("../../integration-tool-types").IntegrationContextQueryDefinition[];
    readonly actionToolDefinitions: import("../../integration-tool-types").IntegrationActionDefinition[];
    assertStartupPreconditions(ctx: AgentChannelPreconditionContext): Promise<void>;
    onBeforeConnect(ctx: AgentChatIntegrationContext): Promise<void>;
    onRemove(ctx: AgentIntegrationRemovalContext): Promise<AgentIntegrationDisconnectWarning | undefined>;
    prepareSentThread(thread: Thread<unknown, unknown>, integration: AgentIntegrationConfig): Promise<void>;
    messageThreadId(message: {
        id: string;
        threadId: string;
        raw?: unknown;
    }, context?: {
        inbound?: boolean;
    }): string | undefined;
    getPlatformAgentContext(chat: ChatInstance): PlatformAgentContext;
    prepareInboundText(text: string, context: PlatformAgentContext): string;
    getReplyExpectation(params: {
        message: BridgeMessageContextParams['message'];
        isNewMention: boolean;
        platformAgentContext: PlatformAgentContext;
    }): ReplyExpectation;
    createBridgeExecutionContext(params: BridgeMessageContextParams): Promise<BridgeExecutionContext>;
    createResumeExecutionContext(params: {
        chat: ChatInstance;
        thread: BridgeMessageContextParams['thread'];
        logger: BridgeMessageContextParams['logger'];
        agentId: string;
        slackThreadContext?: SlackThreadContext;
    }): Promise<BridgeResumeExecutionContext>;
    executeContextQuery(params: PlatformContextQueryParams): Promise<unknown>;
    createAdapter(ctx: AgentChatIntegrationContext): Promise<unknown>;
    handleUnauthenticatedWebhook(context: UnauthenticatedWebhookContext): UnauthenticatedWebhookResponse | undefined;
    private extractBotToken;
    private extractSigningSecret;
    private usesAgentMessagingExperience;
    private isConversationScopedDm;
    private isConversationScopedInbound;
}
