import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiObservationLock } from '../entities/instance-ai-observation-lock.entity';
export declare class InstanceAiObservationLockRepository extends Repository<InstanceAiObservationLock> {
    constructor(dataSource: DataSource);
}
