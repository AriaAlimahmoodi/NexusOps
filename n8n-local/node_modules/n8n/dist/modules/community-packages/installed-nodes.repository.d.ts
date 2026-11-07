import { DataSource, Repository } from '@n8n/typeorm';
import { InstalledNodes } from './installed-nodes.entity';
export declare class InstalledNodesRepository extends Repository<InstalledNodes> {
    constructor(dataSource: DataSource);
}
