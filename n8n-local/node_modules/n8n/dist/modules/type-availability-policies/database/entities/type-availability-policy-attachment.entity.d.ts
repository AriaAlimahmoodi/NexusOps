import { WithTimestamps } from '@n8n/db';
export declare class TypeAvailabilityPolicyAttachment extends WithTimestamps {
    scopeId: string;
    policyId: string;
    priority: number;
    isFloor: boolean;
}
