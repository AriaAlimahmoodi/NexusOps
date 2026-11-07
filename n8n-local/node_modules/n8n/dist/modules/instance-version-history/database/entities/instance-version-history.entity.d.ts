import { WithCreatedAt } from '@n8n/db';
export declare class InstanceVersionHistory extends WithCreatedAt {
    id: number;
    major: number;
    minor: number;
    patch: number;
}
