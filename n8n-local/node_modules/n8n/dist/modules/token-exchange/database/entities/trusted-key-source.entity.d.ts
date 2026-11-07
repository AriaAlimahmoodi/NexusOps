import { WithTimestamps } from '@n8n/db';
import type { TrustedKeySourceStatus, TrustedKeySourceType } from '../../token-exchange.schemas';
export declare class TrustedKeySourceEntity extends WithTimestamps {
    id: string;
    type: TrustedKeySourceType;
    config: string;
    status: TrustedKeySourceStatus;
    lastError: string | null;
    lastRefreshedAt: Date | null;
}
