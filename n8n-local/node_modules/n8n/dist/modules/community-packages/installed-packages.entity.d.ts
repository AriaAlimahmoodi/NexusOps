import { WithTimestamps } from '@n8n/db';
import type { InstalledNodes } from './installed-nodes.entity';
export declare class InstalledPackages extends WithTimestamps {
    packageName: string;
    installedVersion: string;
    authorName?: string;
    authorEmail?: string;
    installedNodes: InstalledNodes[];
}
