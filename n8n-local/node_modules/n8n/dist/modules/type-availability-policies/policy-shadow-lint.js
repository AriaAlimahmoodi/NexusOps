"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintRulesForShadowing = lintRulesForShadowing;
const policy_evaluator_1 = require("./policy-evaluator");
function earlierOccurrence(a, b) {
    if (!a)
        return b;
    if (!b)
        return a;
    return a.index <= b.index ? a : b;
}
function resolvePackageOrUndefined(firstByPackage, resolvePackage, typeName) {
    const packageName = resolvePackage(typeName);
    return packageName === null ? undefined : firstByPackage.get(packageName);
}
function lintRulesForShadowing(rules, resolvePackage = policy_evaluator_1.nodeTypePackageResolver, policedType = (name) => ({ name, baseName: name })) {
    const warnings = [];
    const firstByKind = {
        name: new Map(),
        package: new Map(),
        extends: new Map(),
    };
    const firstFamilyOccurrence = (type) => [type.name, ...(type.ancestors ?? [])]
        .map((name) => firstByKind.extends.get(name))
        .reduce(earlierOccurrence, undefined);
    for (let index = 0; index < rules.length; index++) {
        const rule = rules[index];
        const { selector } = rule;
        let shadowedBy;
        switch (selector.kind) {
            case 'package':
                shadowedBy = firstByKind.package.get(selector.value);
                break;
            case 'extends':
                shadowedBy = firstFamilyOccurrence(policedType(selector.value));
                break;
            case 'name': {
                const type = policedType(selector.value);
                shadowedBy = [
                    firstByKind.name.get(selector.value),
                    firstByKind.name.get(type.baseName),
                    resolvePackageOrUndefined(firstByKind.package, resolvePackage, selector.value),
                    firstFamilyOccurrence(type),
                ].reduce(earlierOccurrence, undefined);
                break;
            }
        }
        if (shadowedBy) {
            warnings.push({ kind: 'shadowed', ruleId: rule.id, shadowedByRuleId: shadowedBy.rule.id });
        }
        const firstOccurrenceByValue = firstByKind[selector.kind];
        if (!firstOccurrenceByValue.has(selector.value)) {
            firstOccurrenceByValue.set(selector.value, { rule, index });
        }
    }
    return warnings;
}
//# sourceMappingURL=policy-shadow-lint.js.map