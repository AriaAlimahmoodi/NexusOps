import { DataSource, Repository } from '@n8n/typeorm';
import { AgentTaskRunLock } from '../entities/agent-task-run-lock.entity';
export type AgentTaskRunLockHandle = Pick<AgentTaskRunLock, 'agentId' | 'taskId' | 'holderId' | 'heldUntil'>;
export declare class AgentTaskRunLockRepository extends Repository<AgentTaskRunLock> {
    constructor(dataSource: DataSource);
    acquire(agentId: string, taskId: string, opts: {
        ttlMs: number;
        holderId: string;
    }): Promise<AgentTaskRunLockHandle | null>;
    renew(handle: AgentTaskRunLockHandle, ttlMs: number): Promise<boolean>;
    release(handle: AgentTaskRunLockHandle): Promise<void>;
}
