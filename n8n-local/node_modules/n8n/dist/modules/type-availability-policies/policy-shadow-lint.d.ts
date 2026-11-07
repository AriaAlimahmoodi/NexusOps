import { type PackageResolver, type PolicedType } from './policy-evaluator';
import type { PolicyRule } from './policy-rule.types';
export type ShadowWarning = {
    readonly kind: 'shadowed';
    readonly ruleId: string;
    readonly shadowedByRuleId: string;
};
export declare function lintRulesForShadowing(rules: readonly PolicyRule[], resolvePackage?: PackageResolver, policedType?: (name: string) => PolicedType): ShadowWarning[];
