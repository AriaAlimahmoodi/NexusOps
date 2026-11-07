import { DataSource, Repository } from '@n8n/typeorm';
import { AgentMemoryEntryEntity } from '../entities/agent-memory-entry.entity';
export declare class AgentMemoryEntryRepository extends Repository<AgentMemoryEntryEntity> {
    constructor(dataSource: DataSource);
}
