import type { PolicyAction, PolicyRule } from '@n8n/api-types';
export type { NonDelegatingPolicyAction, NonDelegatingPolicyRule, PolicyAction, PolicyRule, PolicySelector, } from '@n8n/api-types';
export type PolicyAttachment = {
    readonly policyId: string;
    readonly rules: readonly PolicyRule[];
    readonly priority: number;
    readonly isFloor: boolean;
};
export type PolicyVerdict = {
    readonly action: PolicyAction;
    readonly matchedRuleId: string | null;
};
