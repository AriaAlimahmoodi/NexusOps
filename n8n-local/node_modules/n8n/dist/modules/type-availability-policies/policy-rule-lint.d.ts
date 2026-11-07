import type { PackageResolver, PolicedType } from './policy-evaluator';
import type { PolicyRule, PolicySelector } from './policy-rule.types';
import { type ShadowWarning } from './policy-shadow-lint';
export type NotLoadedWarning = {
    readonly kind: 'notLoaded';
    readonly ruleId: string;
};
export type PolicyRuleWarning = ShadowWarning | NotLoadedWarning;
export declare function lintRulesForMissingTypes(rules: readonly PolicyRule[], isLoaded: (selector: PolicySelector) => boolean): NotLoadedWarning[];
export declare function lintPolicyRules(rules: readonly PolicyRule[], resolvers: {
    resolvePackage: PackageResolver;
    policedType: (name: string) => PolicedType;
    isLoaded: (selector: PolicySelector) => boolean;
}): PolicyRuleWarning[];
