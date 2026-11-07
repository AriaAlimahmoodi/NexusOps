import type { ChatMessageId, ChatSessionId } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { ChatHubConfig, ExecutionsConfig, GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { RedisClientService } from '@n8n/backend-services';
export interface StreamState {
    sessionId: ChatSessionId;
    messageId: ChatMessageId;
    userId: string;
    sequenceNumber: number;
    startedAt: number;
}
export interface BufferedChunk {
    sequenceNumber: number;
    content: string;
}
export interface StartStreamParams {
    sessionId: ChatSessionId;
    messageId: ChatMessageId;
    userId: string;
}
export interface StartExecutionParams {
    sessionId: ChatSessionId;
    userId: string;
}
export declare class ChatStreamStateService {
    private readonly logger;
    private readonly instanceSettings;
    private readonly executionsConfig;
    private readonly globalConfig;
    private readonly chatHubConfig;
    private readonly redisClientService;
    private readonly memoryStore;
    private readonly chunkBuffer;
    private readonly cleanupTimers;
    private readonly useRedis;
    private readonly redisPrefix;
    private readonly cleanupDelayMs;
    private redisClient;
    constructor(logger: Logger, instanceSettings: InstanceSettings, executionsConfig: ExecutionsConfig, globalConfig: GlobalConfig, chatHubConfig: ChatHubConfig, redisClientService: RedisClientService);
    startExecution(params: StartExecutionParams): Promise<void>;
    endExecution(sessionId: ChatSessionId): Promise<void>;
    setCurrentMessage(sessionId: ChatSessionId, messageId: ChatMessageId): Promise<void>;
    startStream(params: StartStreamParams): Promise<void>;
    getStreamState(sessionId: ChatSessionId): Promise<StreamState | null>;
    incrementSequence(sessionId: ChatSessionId): Promise<number>;
    bufferChunk(sessionId: ChatSessionId, chunk: BufferedChunk): Promise<void>;
    getChunksAfter(sessionId: ChatSessionId, lastReceivedSequence: number): Promise<BufferedChunk[]>;
    endStream(sessionId: ChatSessionId): Promise<void>;
    shutdown(): void;
    private getStateKey;
    private getChunksKey;
    private getRedisState;
    private setRedisState;
    private deleteRedisState;
    private getRedisChunks;
    private setRedisChunks;
    private deleteRedisChunks;
    private scheduleCleanup;
    private cancelCleanup;
}
