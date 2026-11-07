import type { NodeTypeAvailabilityScope } from '@n8n/api-types';
import type { PolicyAction, PolicyAttachment, PolicyRule, PolicyVerdict } from './policy-rule.types';
export type ScopePolicy = {
    readonly attachments: readonly PolicyAttachment[];
    readonly defaultAction: PolicyAction;
};
export type ComposedVerdict = {
    readonly action: 'allow' | 'deny';
    readonly scope: NodeTypeAvailabilityScope;
    readonly matchedRuleId: string | null;
    readonly optInAvailable: boolean;
};
export type PackageResolver = (typeName: string) => string | null;
export declare const nodeTypePackageResolver: PackageResolver;
export type PolicedType = {
    readonly name: string;
    readonly baseName: string;
    readonly ancestors?: readonly string[];
};
export declare function orderedAttachments(attachments: readonly PolicyAttachment[]): PolicyAttachment[];
export declare function evaluateType(attachments: readonly PolicyAttachment[], defaultAction: PolicyAction, type: PolicedType, resolvePackage?: PackageResolver): PolicyVerdict;
export declare function evaluateRules(rules: readonly PolicyRule[], defaultAction: PolicyAction, type: PolicedType, resolvePackage?: PackageResolver): PolicyVerdict;
export declare function partitionTypesByAction(rules: readonly PolicyRule[], defaultAction: PolicyAction, types: readonly PolicedType[], resolvePackage?: PackageResolver): Record<PolicyAction, string[]>;
export declare function evaluateComposedType(instance: ScopePolicy, project: ScopePolicy, type: PolicedType, resolvePackage?: PackageResolver): ComposedVerdict;
