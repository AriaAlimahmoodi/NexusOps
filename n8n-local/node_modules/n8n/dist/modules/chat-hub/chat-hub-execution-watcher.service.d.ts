import { Logger } from '@n8n/backend-common';
import { type WorkflowExecuteAfterContext, type WorkflowExecuteResumeContext } from '@n8n/decorators';
import { ChatExecutionManager } from '../../chat/chat-execution-manager';
import { ExecutionPersistence } from '../../executions/execution-persistence';
import { ChatHubExecutionStore } from './chat-hub-execution-store.service';
import { ChatHubExecutionService } from './chat-hub-execution.service';
import { ChatHubMessageRepository } from './chat-message.repository';
import { ChatStreamService } from './chat-stream.service';
export declare class ChatHubExecutionWatcherService {
    private readonly logger;
    private readonly executionStore;
    private readonly messageRepository;
    private readonly chatHubExecutionService;
    private readonly executionPersistence;
    private readonly chatStreamService;
    private readonly executionManager;
    constructor(logger: Logger, executionStore: ChatHubExecutionStore, messageRepository: ChatHubMessageRepository, chatHubExecutionService: ChatHubExecutionService, executionPersistence: ExecutionPersistence, chatStreamService: ChatStreamService, executionManager: ChatExecutionManager);
    handleExecutionResumed(ctx: WorkflowExecuteResumeContext): Promise<void>;
    handleWorkflowExecuteAfter(ctx: WorkflowExecuteAfterContext): Promise<void>;
    private handleWaitingExecution;
    private triggerAutoResume;
    private createNextMessage;
    private pushFinalResults;
    private pushErrorResults;
}
