import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiObservation } from '../entities/instance-ai-observation.entity';
export declare class InstanceAiObservationRepository extends Repository<InstanceAiObservation> {
    constructor(dataSource: DataSource);
    findActiveForThread(threadId: string): Promise<InstanceAiObservation[]>;
}
