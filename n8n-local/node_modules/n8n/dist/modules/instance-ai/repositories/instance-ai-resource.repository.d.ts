import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiResource } from '../entities/instance-ai-resource.entity';
export declare class InstanceAiResourceRepository extends Repository<InstanceAiResource> {
    constructor(dataSource: DataSource);
}
