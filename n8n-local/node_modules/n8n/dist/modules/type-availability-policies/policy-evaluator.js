"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeTypePackageResolver = void 0;
exports.orderedAttachments = orderedAttachments;
exports.evaluateType = evaluateType;
exports.evaluateRules = evaluateRules;
exports.partitionTypesByAction = partitionTypesByAction;
exports.evaluateComposedType = evaluateComposedType;
const nodeTypePackageResolver = (typeName) => typeName.split('.')[0];
exports.nodeTypePackageResolver = nodeTypePackageResolver;
function selectorMatches(selector, type, resolvePackage) {
    switch (selector.kind) {
        case 'name':
            return selector.value === type.name || selector.value === type.baseName;
        case 'package':
            return resolvePackage(type.name) === selector.value;
        case 'extends':
            return selector.value === type.name || (type.ancestors ?? []).includes(selector.value);
    }
}
function orderedAttachments(attachments) {
    const byPriority = (a, b) => a.priority - b.priority;
    const floor = attachments.filter((a) => a.isFloor).sort(byPriority);
    const normal = attachments.filter((a) => !a.isFloor).sort(byPriority);
    return [...floor, ...normal];
}
function evaluateType(attachments, defaultAction, type, resolvePackage = exports.nodeTypePackageResolver) {
    for (const attachment of orderedAttachments(attachments)) {
        const matched = firstMatch(attachment.rules, type, resolvePackage);
        if (matched)
            return matched;
    }
    return { action: defaultAction, matchedRuleId: null };
}
function firstMatch(rules, type, resolvePackage) {
    for (const rule of rules) {
        if (selectorMatches(rule.selector, type, resolvePackage)) {
            return { action: rule.action, matchedRuleId: rule.id };
        }
    }
    return null;
}
function evaluateRules(rules, defaultAction, type, resolvePackage = exports.nodeTypePackageResolver) {
    return firstMatch(rules, type, resolvePackage) ?? { action: defaultAction, matchedRuleId: null };
}
function partitionTypesByAction(rules, defaultAction, types, resolvePackage = exports.nodeTypePackageResolver) {
    const partition = { allow: [], deny: [], delegate: [] };
    for (const type of types) {
        partition[evaluateRules(rules, defaultAction, type, resolvePackage).action].push(type.name);
    }
    return partition;
}
function evaluateComposedType(instance, project, type, resolvePackage = exports.nodeTypePackageResolver) {
    const instanceVerdict = evaluateType(instance.attachments, instance.defaultAction, type, resolvePackage);
    if (instanceVerdict.action === 'deny') {
        return {
            action: 'deny',
            scope: 'instance',
            matchedRuleId: instanceVerdict.matchedRuleId,
            optInAvailable: false,
        };
    }
    const projectVerdict = evaluateType(project.attachments, project.defaultAction, type, resolvePackage);
    if (instanceVerdict.action === 'delegate') {
        if (projectVerdict.action === 'allow' && projectVerdict.matchedRuleId !== null) {
            return {
                action: 'allow',
                scope: 'project',
                matchedRuleId: projectVerdict.matchedRuleId,
                optInAvailable: false,
            };
        }
        if (projectVerdict.action !== 'allow') {
            return {
                action: 'deny',
                scope: 'project',
                matchedRuleId: projectVerdict.matchedRuleId,
                optInAvailable: true,
            };
        }
        return {
            action: 'deny',
            scope: 'instance',
            matchedRuleId: instanceVerdict.matchedRuleId,
            optInAvailable: true,
        };
    }
    if (projectVerdict.action !== 'allow') {
        return {
            action: 'deny',
            scope: 'project',
            matchedRuleId: projectVerdict.matchedRuleId,
            optInAvailable: false,
        };
    }
    return {
        action: 'allow',
        scope: projectVerdict.matchedRuleId !== null ? 'project' : 'instance',
        matchedRuleId: projectVerdict.matchedRuleId ?? instanceVerdict.matchedRuleId,
        optInAvailable: false,
    };
}
//# sourceMappingURL=policy-evaluator.js.map