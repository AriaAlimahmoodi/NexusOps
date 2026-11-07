import { User, WithTimestamps } from '@n8n/db';
import { TrustedSourceEntity } from './trusted-source.entity';
export type TrustedSourceIdentityProvenance = 'user-proven' | 'claim-match' | 'admin' | 'provisioning' | 'jit';
export type TrustedSourceIdentityStatus = 'active' | 'suspended' | 'revoked';
export declare class TrustedSourceIdentityEntity extends WithTimestamps {
    sourceId: string;
    subject: string;
    source: TrustedSourceEntity;
    userId: string;
    user: User;
    provenance: TrustedSourceIdentityProvenance;
    status: TrustedSourceIdentityStatus;
    lastSeenAt: Date | null;
}
