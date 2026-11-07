import { WithTimestampsAndStringId } from '@n8n/db';
import type { PolicyAction } from '../../policy-rule.types';
export declare class TypeAvailabilityPolicyScope extends WithTimestampsAndStringId {
    kind: string;
    projectId: string | null;
    defaultAction: PolicyAction;
    version: number;
    updatedBy: string;
}
