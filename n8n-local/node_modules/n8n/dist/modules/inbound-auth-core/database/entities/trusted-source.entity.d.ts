import { WithTimestampsAndStringId } from '@n8n/db';
export type TrustedSourceType = 'oauth2';
export type TrustedSourceManagedBy = 'system' | 'admin';
export type TrustedSourceStatus = 'unchecked' | 'healthy' | 'error';
export declare class TrustedSourceEntity extends WithTimestampsAndStringId {
    name: string;
    type: TrustedSourceType;
    issuer: string;
    managedBy: TrustedSourceManagedBy;
    status: TrustedSourceStatus;
    lastError: string | null;
    lastCheckedAt: Date | null;
    configVersion: number;
    config: string;
    metadata: string | null;
    discoveryClaimToken: string | null;
    discoveryClaimedAt: Date | null;
}
