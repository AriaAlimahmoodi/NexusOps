import { BaseEntity } from '@n8n/typeorm';
import { InstalledPackages } from './installed-packages.entity';
export declare class InstalledNodes extends BaseEntity {
    name: string;
    type: string;
    latestVersion: number;
    package: InstalledPackages;
}
