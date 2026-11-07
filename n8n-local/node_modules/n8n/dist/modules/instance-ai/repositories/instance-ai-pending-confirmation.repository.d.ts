import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiPendingConfirmation } from '../entities/instance-ai-pending-confirmation.entity';
export declare class InstanceAiPendingConfirmationRepository extends Repository<InstanceAiPendingConfirmation> {
    constructor(dataSource: DataSource);
    claim(requestId: string, userId: string): Promise<InstanceAiPendingConfirmation | undefined>;
    deleteByRequestId(requestId: string): Promise<number>;
    deleteByThreadId(threadId: string): Promise<number>;
    deleteByRunId(runId: string): Promise<number>;
    deleteExpired(now: Date): Promise<number>;
    isPastExpiry(requestId: string, userId: string, now: Date): Promise<boolean>;
    findByThreadId(threadId: string): Promise<InstanceAiPendingConfirmation[]>;
    findLiveRequestIds(requestIds: string[], now: Date): Promise<Set<string>>;
}
