import type { Relation } from '@n8n/typeorm';
import { TrustedKeySourceEntity } from './trusted-key-source.entity';
export declare class TrustedKeyEntity {
    sourceId: string;
    kid: string;
    data: string;
    createdAt: Date;
    source: Relation<TrustedKeySourceEntity>;
}
