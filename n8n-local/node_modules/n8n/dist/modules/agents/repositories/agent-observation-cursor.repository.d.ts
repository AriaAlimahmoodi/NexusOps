import { DataSource, Repository } from '@n8n/typeorm';
import { AgentObservationCursorEntity } from '../entities/agent-observation-cursor.entity';
export declare class AgentObservationCursorRepository extends Repository<AgentObservationCursorEntity> {
    constructor(dataSource: DataSource);
}
