import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiObservationCursor } from '../entities/instance-ai-observation-cursor.entity';
export declare class InstanceAiObservationCursorRepository extends Repository<InstanceAiObservationCursor> {
    constructor(dataSource: DataSource);
    findForThread(threadId: string): Promise<InstanceAiObservationCursor | null>;
}
