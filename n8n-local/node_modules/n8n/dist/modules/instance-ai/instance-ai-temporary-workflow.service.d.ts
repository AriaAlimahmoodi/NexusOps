import { Logger } from '@n8n/backend-common';
import { AiBuilderTemporaryWorkflowRepository, UserRepository, type User } from '@n8n/db';
import { InstanceAiAdapterService } from './instance-ai.adapter.service';
import { InstanceAiThreadRepository } from './repositories/instance-ai-thread.repository';
export declare class InstanceAiTemporaryWorkflowService {
    private readonly adapterService;
    private readonly threadRepo;
    private readonly userRepository;
    private readonly aiBuilderTemporaryWorkflowRepository;
    private readonly logger;
    constructor(logger: Logger, adapterService: InstanceAiAdapterService, threadRepo: InstanceAiThreadRepository, userRepository: UserRepository, aiBuilderTemporaryWorkflowRepository: AiBuilderTemporaryWorkflowRepository);
    reapForRun(threadId: string, user: User, createdWorkflowIds: Set<string> | undefined, runningTaskCount: number): Promise<string[]>;
    reapForThreadCleanup(threadId: string): Promise<void>;
    private archive;
}
