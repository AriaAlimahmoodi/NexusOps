import type { AgentIntegrationConfig, AgentIntegrationDisconnectWarning, RichCardComponentType } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { Attachment, Message, Thread } from 'chat';
import { AgentRepository } from '../../../repositories/agent.repository';
import { AgentChatIntegration, type AgentChannelPreconditionContext, type AgentChatIntegrationContext, type AgentIntegrationRemovalContext, type BridgeExecutionContext, type BridgeMessageContextParams, type BridgeResumeExecutionContext, type PlatformContextQueryParams } from '../../agent-chat-integration';
import { type SuspendComponent } from '../../component-mapper';
import type { IntegrationAction, ReplyExpectation } from '../../integration-tool-types';
export declare class TeamsIntegration extends AgentChatIntegration {
    private readonly logger;
    private readonly agentRepository;
    readonly type = "teams";
    onRemove(ctx: AgentIntegrationRemovalContext): Promise<AgentIntegrationDisconnectWarning | undefined>;
    readonly credentialTypes: string[];
    readonly displayLabel = "Microsoft Teams";
    readonly displayIcon = "teams";
    readonly internal = true;
    readonly builderGuidance: {
        capabilities: string[];
        useIntegrationWhen: string[];
        useNodeToolWhen: string[];
    };
    readonly supportedComponents: readonly RichCardComponentType[];
    readonly contextToolDefinitions: import("../../integration-tool-types").IntegrationContextQueryDefinition[];
    readonly contextToolGuidance: string[];
    readonly actionToolDefinitions: import("../../integration-tool-types").IntegrationActionDefinition[];
    readonly actionToolGuidance: string[];
    readonly targetSuspensionCardAtActingUser = true;
    readonly disableStreaming = false;
    readonly singleStreamedRunPerTurn = true;
    shouldHandleUnmentionedMessage({ message, integration, }: {
        message: {
            raw: unknown;
        };
        integration: AgentIntegrationConfig;
    }): boolean;
    getReplyExpectation({ message, isNewMention, }: {
        message: {
            isMention?: boolean;
            raw: unknown;
        };
        isNewMention: boolean;
    }): ReplyExpectation;
    normalizeChannelId(channelId: string, adapter: unknown): string;
    describeActionError(action: IntegrationAction, error: unknown): {
        code: "PERMISSION_NOT_GRANTED";
        message: string;
    } | undefined;
    executeContextQuery(params: PlatformContextQueryParams): Promise<unknown>;
    fetchInboundAttachments({ thread, message, }: {
        thread: Thread<unknown, unknown>;
        message: Message<unknown>;
    }): Promise<Attachment[]>;
    constructor(logger: Logger, agentRepository: AgentRepository);
    createAdapter(ctx: AgentChatIntegrationContext): Promise<unknown>;
    assertStartupPreconditions(ctx: AgentChannelPreconditionContext): Promise<void>;
    onBeforeConnect(ctx: AgentChatIntegrationContext): Promise<void>;
    normalizeComponents(components: SuspendComponent[]): SuspendComponent[];
    createBridgeExecutionContext(params: BridgeMessageContextParams): Promise<BridgeExecutionContext>;
    createResumeExecutionContext(params: {
        thread: BridgeMessageContextParams['thread'];
        logger: BridgeMessageContextParams['logger'];
        agentId: string;
    }): Promise<BridgeResumeExecutionContext>;
    private startTyping;
    private extractBotCredentials;
}
