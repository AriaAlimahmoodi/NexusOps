import type { IterationEntry, IterationLog } from '@n8n/instance-ai';
import { InstanceAiIterationLogRepository } from '../repositories/instance-ai-iteration-log.repository';
export declare class DbIterationLogStorage implements IterationLog {
    private readonly repo;
    constructor(repo: InstanceAiIterationLogRepository);
    append(threadId: string, taskKey: string, entry: IterationEntry): Promise<void>;
    getForTask(threadId: string, taskKey: string): Promise<IterationEntry[]>;
    clear(threadId: string): Promise<void>;
}
