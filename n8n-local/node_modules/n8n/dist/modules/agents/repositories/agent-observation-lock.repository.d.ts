import { DataSource, Repository } from '@n8n/typeorm';
import { AgentObservationLockEntity } from '../entities/agent-observation-lock.entity';
export declare class AgentObservationLockRepository extends Repository<AgentObservationLockEntity> {
    constructor(dataSource: DataSource);
}
