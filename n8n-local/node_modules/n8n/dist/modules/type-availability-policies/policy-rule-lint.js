"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintRulesForMissingTypes = lintRulesForMissingTypes;
exports.lintPolicyRules = lintPolicyRules;
const policy_shadow_lint_1 = require("./policy-shadow-lint");
function lintRulesForMissingTypes(rules, isLoaded) {
    return rules
        .filter((rule) => !isLoaded(rule.selector))
        .map((rule) => ({ kind: 'notLoaded', ruleId: rule.id }));
}
function lintPolicyRules(rules, resolvers) {
    const position = new Map(rules.map((rule, index) => [rule.id, index]));
    const warnings = [
        ...(0, policy_shadow_lint_1.lintRulesForShadowing)(rules, resolvers.resolvePackage, resolvers.policedType),
        ...lintRulesForMissingTypes(rules, resolvers.isLoaded),
    ];
    return warnings.sort((a, b) => (position.get(a.ruleId) ?? 0) - (position.get(b.ruleId) ?? 0));
}
//# sourceMappingURL=policy-rule-lint.js.map