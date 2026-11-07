import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiIterationLog } from '../entities/instance-ai-iteration-log.entity';
export declare class InstanceAiIterationLogRepository extends Repository<InstanceAiIterationLog> {
    constructor(dataSource: DataSource);
}
