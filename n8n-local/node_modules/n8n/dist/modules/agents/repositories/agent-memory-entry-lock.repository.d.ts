import { DataSource, Repository } from '@n8n/typeorm';
import { AgentMemoryEntryLockEntity } from '../entities/agent-memory-entry-lock.entity';
export declare class AgentMemoryEntryLockRepository extends Repository<AgentMemoryEntryLockEntity> {
    constructor(dataSource: DataSource);
}
