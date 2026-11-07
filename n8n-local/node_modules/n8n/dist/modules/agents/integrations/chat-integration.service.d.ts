import { AgentIntegrationConfig, type AgentIntegrationSettings } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import type { Channel, Thread, UserInfo } from 'chat';
import { InstanceSettings } from 'n8n-core';
import { CredentialsService } from '../../../credentials/credentials.service';
import type { PubSubCommandMap } from '../../../scaling/pubsub/pubsub.event-map';
import { UrlService } from '@n8n/backend-services';
import { AgentChatBridge } from './agent-chat-bridge';
import { ChatIntegrationRegistry } from './agent-chat-integration';
import { AgentChatSubscriptionStateService } from './agent-chat-subscription-state.service';
import type { CallbackMetadata } from './callback-store';
import { type ShortenCallback } from './component-mapper';
import { LeaderChannelRelayService } from './leader-channel-relay.service';
import { type ProjectAgent } from '../entities/agent.entity';
import { AgentChangePublisher } from '../agent-change-publisher.service';
import { type AgentChannelRef, type IntegrationRef } from '../utils/agent-channel';
import { AgentRepository } from '../repositories/agent.repository';
import { AgentChannelStatusReporter } from './agent-channel-status-reporter';
type WebhookHandler = (request: Request, options?: {
    waitUntil?: (task: Promise<unknown>) => void;
}) => Promise<Response>;
export interface ChatInstance {
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    webhooks: Record<string, WebhookHandler>;
    onNewMention: (handler: unknown) => void;
    onSubscribedMessage: (handler: unknown) => void;
    onAction: (handler: unknown) => void;
    getAdapter(name: string): unknown;
    openDM(user: string): Promise<Thread>;
    thread(threadId: string): Thread;
    channel(channelId: string): Channel;
    getUser(user: string): Promise<UserInfo | null>;
}
interface ConnectOptions {
    ingressEnabled?: boolean;
    skipExternalHooks?: boolean;
    settings?: AgentIntegrationSettings;
}
interface DisconnectOptions {
    skipExternalHooks?: boolean;
}
interface DisconnectChannelOptions {
    deleteSubscriptions?: boolean;
}
export declare class ChatIntegrationService {
    private readonly logger;
    private readonly agentRepository;
    private readonly credentialsService;
    private readonly urlService;
    private readonly integrationRegistry;
    private readonly instanceSettings;
    private readonly changePublisher;
    private readonly globalConfig;
    private readonly chatSubscriptionStateService;
    private readonly statusReporter;
    private readonly leaderChannelRelay;
    private readonly connections;
    private readonly outboundConnections;
    private readonly outboundConnectionInitializations;
    private readonly leaderOperations;
    private shuttingDown;
    constructor(logger: Logger, agentRepository: AgentRepository, credentialsService: CredentialsService, urlService: UrlService, integrationRegistry: ChatIntegrationRegistry, instanceSettings: InstanceSettings, changePublisher: AgentChangePublisher, globalConfig: GlobalConfig, chatSubscriptionStateService: AgentChatSubscriptionStateService, statusReporter: AgentChannelStatusReporter, leaderChannelRelay: LeaderChannelRelayService);
    broadcastIntegrationChange(agentId: string, integration: AgentIntegrationConfig, action: 'connect' | 'disconnect'): Promise<void>;
    private integrationFromConnectionKey;
    assertStartupPreconditions(agentId: string, integration: AgentIntegrationConfig, projectId: string): Promise<void>;
    validateBeforeConnect(agentId: string, integration: AgentIntegrationConfig, projectId: string): Promise<void>;
    connect(agentId: string, integration: AgentIntegrationConfig, projectId: string, options?: ConnectOptions): Promise<void>;
    private connectLocal;
    private establishConnection;
    disconnect(agentId: string, integration?: IntegrationRef, options?: DisconnectOptions): Promise<void>;
    releaseChannelLocally(agentId: string, integration: IntegrationRef): Promise<void>;
    disconnectChannel(agentId: string, integration: AgentIntegrationConfig, options?: DisconnectChannelOptions): Promise<void>;
    disconnectAll(): Promise<void>;
    private localRuntimeKeys;
    disconnectLeaderOnlyIntegrations(): Promise<void>;
    syncToConfig(agent: ProjectAgent, previous: AgentIntegrationConfig[], next: AgentIntegrationConfig[]): Promise<void>;
    getChatInstance(agentId: string, integration?: IntegrationRef): ChatInstance | undefined;
    getBridge(agentId: string, integrationType: string, credentialId?: string): AgentChatBridge | undefined;
    acquireQueueBridge(agentId: string, integrationType: string, credentialId: string): {
        bridge: AgentChatBridge;
        release: () => void;
    } | undefined;
    private findConnection;
    isChannelLive(agentId: string, integration: IntegrationRef): boolean;
    getChatInstanceForTools(agentId: string, integration: IntegrationRef): Promise<ChatInstance | undefined>;
    getShortenCallback(agentId: string, integration: IntegrationRef, metadata?: CallbackMetadata): ShortenCallback | undefined;
    getWebhookHandler(agentId: string, platform: string, connectionSelector?: string): WebhookHandler | undefined;
    listLiveChannels(): AgentChannelRef[];
    hasLiveChannel(ref: AgentChannelRef): boolean;
    startChannel(agent: ProjectAgent, integration: AgentIntegrationConfig): Promise<void>;
    handleIntegrationChanged(payload: PubSubCommandMap['agent-chat-integration-changed']): Promise<void>;
    handleLeaderChannelRequest(payload: PubSubCommandMap['agent-chat-leader-channel-request']): Promise<void>;
    private shouldRouteToLeader;
    private runLeaderOperation;
    private settleLeaderOperations;
    private disconnectLocal;
    private disconnectOutboundOne;
    private disposeOutboundConnection;
    private disconnectOne;
    private runDisconnectedHook;
    private decryptCredentialForProject;
    private buildWebhookUrl;
    private connectOptionsFor;
    private createConnectionContext;
    private initializeConnection;
    private createChatBridge;
    private cleanupFailedConnection;
    private runConnectedHook;
    private reportOutboundError;
    private initializeOutboundConnection;
    private applyLeaderChannelRequest;
    private runBeforeDisconnectHook;
}
export {};
