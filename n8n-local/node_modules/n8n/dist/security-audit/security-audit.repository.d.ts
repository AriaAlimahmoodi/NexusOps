import { DataSource, Repository } from '@n8n/typeorm';
import { InstalledPackages } from '../modules/community-packages/installed-packages.entity';
export declare class PackagesRepository extends Repository<InstalledPackages> {
    constructor(dataSource: DataSource);
}
