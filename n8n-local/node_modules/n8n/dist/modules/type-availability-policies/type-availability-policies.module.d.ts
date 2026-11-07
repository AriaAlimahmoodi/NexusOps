import type { ModuleInterface } from '@n8n/decorators';
export declare class TypeAvailabilityPoliciesModule implements ModuleInterface {
    init(): Promise<void>;
    entities(): Promise<(typeof import("./database/entities/type-availability-policy.entity.js").TypeAvailabilityPolicy | typeof import("./database/entities/type-availability-policy-attachment.entity.js").TypeAvailabilityPolicyAttachment | typeof import("./database/entities/type-availability-policy-scope.entity.js").TypeAvailabilityPolicyScope)[]>;
}
