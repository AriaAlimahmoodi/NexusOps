import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiThreadGrant } from '../entities/instance-ai-thread-grant.entity';
export declare class InstanceAiThreadGrantRepository extends Repository<InstanceAiThreadGrant> {
    constructor(dataSource: DataSource);
    grant(threadId: string, userId: string, grantKey: string): Promise<void>;
    revoke(threadId: string, userId: string, grantKey: string): Promise<void>;
    findKeys(threadId: string, userId: string): Promise<Set<string>>;
}
