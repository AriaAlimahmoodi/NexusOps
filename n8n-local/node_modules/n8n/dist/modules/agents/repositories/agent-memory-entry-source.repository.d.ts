import { DataSource, Repository } from '@n8n/typeorm';
import { AgentMemoryEntrySourceEntity } from '../entities/agent-memory-entry-source.entity';
export declare class AgentMemoryEntrySourceRepository extends Repository<AgentMemoryEntrySourceEntity> {
    constructor(dataSource: DataSource);
}
