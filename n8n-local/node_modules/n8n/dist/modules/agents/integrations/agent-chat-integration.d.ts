import { AgentIntegrationConfig, type AgentIntegrationDisconnectWarning, type RichCardComponentType } from '@n8n/api-types';
import type { User } from '@n8n/db';
import type { Attachment, Thread, Author, Message } from 'chat';
import { UserError, type Logger } from 'n8n-workflow';
import type { ChatInstance } from './chat-integration.service';
import type { NormalizeComponentsContext, SuspendComponent } from './component-mapper';
import type { IntegrationErrorCode } from './integration-error-codes';
import type { SlackThreadContext } from './platforms/slack/slack-bridge-behavior';
import type { IntegrationAction, IntegrationActionDefinition, IntegrationActionParams, IntegrationActionResult, IntegrationContextQuery, IntegrationContextQueryDefinition, IntegrationContextQueryParams, IntegrationPlatformMessageContext, ReplyExpectation } from './integration-tools';
export declare class InboundAttachmentAccessError extends UserError {
}
export interface AgentChannelPreconditionContext {
    agentId: string;
    projectId: string;
    credentialId: string;
}
export interface AgentChatIntegrationContext extends AgentChannelPreconditionContext {
    integration: AgentIntegrationConfig;
    credential: Record<string, unknown>;
    ingressEnabled: boolean;
    webhookUrlFor: (platform: string) => string;
}
export interface AgentIntegrationRemovalContext {
    agentId: string;
    projectId: string;
    credentialId: string;
    user: User;
    deleteExternalResource?: boolean;
}
export interface UnauthenticatedWebhookResponse {
    status: number;
    body: unknown;
    raw?: boolean;
}
export interface UnauthenticatedWebhookContext {
    agentId: string;
    method: string;
    query: Readonly<Record<string, string | string[] | undefined>>;
    headers: Readonly<Record<string, string | string[] | undefined>>;
    body: unknown;
}
export interface WebhookRequestContext {
    headers: Readonly<Record<string, string | string[] | undefined>>;
    body: unknown;
}
export type WebhookRequestResolution = {
    type: 'reject';
    response: UnauthenticatedWebhookResponse;
} | {
    type: 'select';
    connectionSelector: string;
} | {
    type: 'no_match';
};
export interface AgentChatIntegrationBuilderGuidance {
    capabilities: string[];
    useIntegrationWhen: string[];
    useNodeToolWhen: string[];
}
export interface PlatformAgentContext {
    agentUserId?: string;
}
export interface BridgeStatusHandle {
    clearBeforeResponse(): Promise<void>;
}
export declare function onceStatusHandle(handle: BridgeStatusHandle | undefined): BridgeStatusHandle | undefined;
type EphemeralPostable = Parameters<Thread<unknown, unknown>['postEphemeral']>[1];
export declare function postToUserOrThread(thread: Thread<unknown, unknown>, user: string | Author, payload: EphemeralPostable): Promise<void>;
export interface BridgeExecutionContext {
    platformAgentContext: PlatformAgentContext;
    slackThreadContext?: SlackThreadContext;
    platformMessage?: IntegrationPlatformMessageContext;
    forceBuffered?: boolean;
    statusHandle?: BridgeStatusHandle;
    historyContext?: string;
}
export type BridgeResumeExecutionContext = Pick<BridgeExecutionContext, 'forceBuffered' | 'statusHandle'>;
export interface BridgeMessageContextParams {
    startStatus?: boolean;
    chat: ChatInstance;
    thread: Thread<unknown, unknown>;
    message: Message<unknown>;
    integration: AgentIntegrationConfig;
    logger: Logger;
    agentId: string;
    statusRetry?: AbortController;
    isNewMention: boolean;
    inSubscribedThread?: boolean;
    replyExpectation: ReplyExpectation;
}
export interface ActionDecisionMessageParams {
    approved?: boolean;
    selectedLabel?: string;
    raw: unknown;
    user: Author;
}
export type ActionDecisionMessageFormatter = (params: ActionDecisionMessageParams) => string | undefined;
export interface SettleActionMessageParams {
    agentId: string;
    integration: AgentIntegrationConfig;
    threadId: string;
    messageId: string;
    content: string;
}
export type SettleActionMessage = (params: SettleActionMessageParams) => Promise<void>;
export declare abstract class AgentChatIntegration {
    abstract readonly type: string;
    abstract readonly credentialTypes: string[];
    abstract readonly displayLabel: string;
    abstract readonly displayIcon: string;
    readonly builderGuidance?: AgentChatIntegrationBuilderGuidance;
    readonly supportedComponents?: readonly RichCardComponentType[];
    readonly contextToolDefinitions: IntegrationContextQueryDefinition[];
    readonly actionToolDefinitions: IntegrationActionDefinition[];
    readonly contextToolGuidance?: string[];
    readonly actionToolGuidance?: string[];
    get contextQueries(): IntegrationContextQuery[];
    get actions(): IntegrationAction[];
    readonly needsShortCallbackData: boolean;
    readonly deleteActionMessageBeforeResume: boolean;
    readonly defaultSessionIdleTimeoutMinutes: number | null;
    readonly targetSuspensionCardAtActingUser: boolean;
    readonly disableStreaming: boolean;
    readonly singleStreamedRunPerTurn: boolean;
    readonly internal: boolean;
    readonly requiresChatInstance: boolean;
    requiresLeader(_options?: {
        ingressEnabled: boolean;
    }): boolean;
    abstract createAdapter(ctx: AgentChatIntegrationContext): Promise<unknown>;
    validateConfig?(integration: AgentIntegrationConfig): void;
    handleUnauthenticatedWebhook?(context: UnauthenticatedWebhookContext): UnauthenticatedWebhookResponse | undefined;
    resolveWebhookRequest?(request: WebhookRequestContext): WebhookRequestResolution;
    matchesWebhookConnection?(credential: Record<string, unknown>, connectionSelector: string): boolean;
    onBeforeConnect?(ctx: AgentChatIntegrationContext): Promise<void>;
    assertStartupPreconditions?(ctx: AgentChannelPreconditionContext): Promise<void>;
    onAfterConnect?(ctx: AgentChatIntegrationContext): Promise<void>;
    onBeforeDisconnect?(ctx: AgentChatIntegrationContext): Promise<void>;
    onRemove?(ctx: AgentIntegrationRemovalContext): Promise<AgentIntegrationDisconnectWarning | undefined>;
    prepareSentThread?(thread: Thread<unknown, unknown>, integration: AgentIntegrationConfig): Promise<void>;
    normalizeChannelId(channelId: string, _adapter: unknown): string;
    describeActionError?(action: IntegrationAction, error: unknown): {
        code: IntegrationErrorCode;
        message: string;
    } | undefined;
    onConnected?(ctx: AgentChatIntegrationContext): Promise<void>;
    onDisconnected?(ctx: AgentChatIntegrationContext): Promise<void>;
    normalizeComponents?(components: SuspendComponent[], context: NormalizeComponentsContext): SuspendComponent[];
    formatThreadId?: {
        fromSdk: (thread: Thread<unknown, unknown>) => string;
        toSdk: (threadId: string) => string;
    };
    messageThreadId?(message: {
        id: string;
        threadId: string;
        raw?: unknown;
    }, context?: {
        inbound?: boolean;
    }): string | undefined;
    isUserAllowed?(author: Author, settings: AgentIntegrationConfig | undefined): boolean;
    getPlatformAgentContext?(chat: ChatInstance): PlatformAgentContext;
    prepareInboundText?(text: string, context: PlatformAgentContext): string;
    fetchInboundAttachments?(params: {
        thread: Thread<unknown, unknown>;
        message: Message<unknown>;
    }): Promise<Attachment[]>;
    getReplyExpectation?(params: {
        message: Message<unknown>;
        isNewMention: boolean;
        platformAgentContext: PlatformAgentContext;
    }): ReplyExpectation;
    formatActionDecisionMessage?(params: ActionDecisionMessageParams): string | undefined;
    settleActionMessage?(params: SettleActionMessageParams): Promise<void>;
    shouldSubscribeToNewMention?(params: {
        thread: Thread<unknown, unknown>;
        message: Message<unknown>;
    }): boolean;
    shouldHandleUnmentionedMessage?(params: {
        thread: Thread<unknown, unknown>;
        message: Message<unknown>;
        integration: AgentIntegrationConfig;
    }): boolean;
    createBridgeExecutionContext?(params: BridgeMessageContextParams): Promise<BridgeExecutionContext>;
    createResumeExecutionContext?(params: {
        chat: ChatInstance;
        thread: Thread<unknown, unknown>;
        logger: Logger;
        agentId: string;
        slackThreadContext?: BridgeExecutionContext['slackThreadContext'];
        integration?: AgentIntegrationConfig;
    }): Promise<BridgeResumeExecutionContext>;
    shouldDownloadAttachments?(integration: AgentIntegrationConfig): boolean;
    executeContextQuery?(params: PlatformContextQueryParams): Promise<unknown>;
    executeAction?(params: PlatformActionParams): Promise<IntegrationActionResult | undefined>;
}
export interface PlatformContextQueryParams extends Omit<IntegrationContextQueryParams, 'persistence'> {
    chat: ChatInstance | undefined;
}
export interface PlatformActionParams extends Omit<IntegrationActionParams, 'awaitResponse' | 'runId' | 'toolCallId'> {
    chat: ChatInstance | undefined;
}
export declare class ChatIntegrationRegistry {
    private readonly integrations;
    register(integration: AgentChatIntegration): void;
    get(type: string): AgentChatIntegration | undefined;
    require(type: string): AgentChatIntegration;
    list(): AgentChatIntegration[];
    listPublic(): AgentChatIntegration[];
}
export {};
