import type { TypeAvailabilityPolicyScope } from './database/entities/type-availability-policy-scope.entity';
import type { PolicyAction, PolicyAttachment, PolicyRule } from './policy-rule.types';
export declare const UNCONFIGURED_VERSION = 0;
export type EffectivePolicy = {
    readonly scopeId: string | null;
    readonly kind: string;
    readonly projectId: string | null;
    readonly defaultAction: PolicyAction;
    readonly version: number;
    readonly rules: readonly PolicyRule[];
    readonly attachments: readonly PolicyAttachment[];
};
export type ProjectEffectivePolicy = EffectivePolicy & {
    readonly projectId: string;
};
export declare function unconfiguredScope(kind: string, projectId: string | null): EffectivePolicy;
export declare function toEffectivePolicy(scope: TypeAvailabilityPolicyScope, attachments: readonly PolicyAttachment[]): EffectivePolicy;
