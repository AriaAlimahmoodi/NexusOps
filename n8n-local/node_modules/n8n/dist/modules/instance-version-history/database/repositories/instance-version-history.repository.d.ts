import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceVersionHistory } from '../entities/instance-version-history.entity';
export declare class InstanceVersionHistoryRepository extends Repository<InstanceVersionHistory> {
    constructor(dataSource: DataSource);
}
