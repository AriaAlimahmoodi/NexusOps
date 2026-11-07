import { WithTimestampsAndStringId } from '@n8n/db';
import type { PolicyRule } from '../../policy-rule.types';
export declare class TypeAvailabilityPolicy extends WithTimestampsAndStringId {
    kind: string;
    rules: PolicyRule[];
    version: number;
    updatedBy: string;
}
