import { Logger } from '@n8n/backend-common';
import { ErrorReporter } from 'n8n-core';
import { ChatExecutionManager } from './chat-execution-manager';
import { type ChatRequest } from './chat-service.types';
export declare class ChatService {
    private readonly executionManager;
    private readonly logger;
    private readonly errorReporter;
    private readonly sessions;
    private heartbeatIntervalId;
    constructor(executionManager: ChatExecutionManager, logger: Logger, errorReporter: ErrorReporter);
    startSession(req: ChatRequest): Promise<void>;
    private processWaitingExecution;
    private processSuccessExecution;
    private waitForChatResponseOrContinue;
    private pollAndProcessChatResponses;
    private incomingMessageHandler;
    private resumeExecution;
    private getExecutionOrCleanupSession;
    private stringifyRawData;
    private cleanupSession;
    private parseChatMessage;
    private checkHeartbeats;
    shutdown(): void;
}
