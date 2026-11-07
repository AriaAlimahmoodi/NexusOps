import { DataSource, Repository } from '@n8n/typeorm';
import { AgentObservationEntity } from '../entities/agent-observation.entity';
export declare class AgentObservationRepository extends Repository<AgentObservationEntity> {
    constructor(dataSource: DataSource);
}
