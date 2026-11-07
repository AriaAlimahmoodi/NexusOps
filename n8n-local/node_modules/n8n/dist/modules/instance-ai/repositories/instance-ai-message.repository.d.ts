import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiMessage } from '../entities/instance-ai-message.entity';
export declare class InstanceAiMessageRepository extends Repository<InstanceAiMessage> {
    constructor(dataSource: DataSource);
}
