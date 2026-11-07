import type { ChatHubConversationModel, ChatMessageId, ChatSessionId } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { ChatHubConfig, ExecutionsConfig, GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { RedisClientService } from '@n8n/backend-services';
import type { NonStreamingResponseMode } from './chat-hub.types';
export interface ChatHubExecutionContext {
    executionId: string;
    sessionId: ChatSessionId;
    userId: string;
    messageId: ChatMessageId;
    previousMessageId: ChatMessageId | null;
    model: ChatHubConversationModel;
    responseMode: NonStreamingResponseMode;
    awaitingResume: boolean;
    createMessageOnResume: boolean;
    workflowId?: string;
}
export declare class ChatHubExecutionStore {
    private readonly logger;
    private readonly instanceSettings;
    private readonly executionsConfig;
    private readonly globalConfig;
    private readonly chatHubConfig;
    private readonly redisClientService;
    private readonly memoryStore;
    private readonly cleanupTimers;
    private readonly useRedis;
    private readonly redisPrefix;
    private readonly cleanupDelayMs;
    private redisClient;
    constructor(logger: Logger, instanceSettings: InstanceSettings, executionsConfig: ExecutionsConfig, globalConfig: GlobalConfig, chatHubConfig: ChatHubConfig, redisClientService: RedisClientService);
    register(context: ChatHubExecutionContext): Promise<void>;
    get(executionId: string): Promise<ChatHubExecutionContext | null>;
    update(executionId: string, updates: Partial<Omit<ChatHubExecutionContext, 'executionId'>>): Promise<void>;
    remove(executionId: string): Promise<void>;
    shutdown(): void;
    private getContextKey;
    private getRedisContext;
    private setRedisContext;
    private deleteRedisContext;
    private scheduleCleanup;
    private cancelCleanup;
}
