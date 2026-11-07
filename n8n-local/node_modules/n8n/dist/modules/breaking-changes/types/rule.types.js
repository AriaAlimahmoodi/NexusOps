"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakingChangeCategory = void 0;
exports.isWorkflowLevelRule = isWorkflowLevelRule;
exports.isInstanceRule = isInstanceRule;
var BreakingChangeCategory;
(function (BreakingChangeCategory) {
    BreakingChangeCategory["workflow"] = "workflow";
    BreakingChangeCategory["instance"] = "instance";
    BreakingChangeCategory["environment"] = "environment";
    BreakingChangeCategory["database"] = "database";
    BreakingChangeCategory["infrastructure"] = "infrastructure";
})(BreakingChangeCategory || (exports.BreakingChangeCategory = BreakingChangeCategory = {}));
function isWorkflowLevelRule(rule) {
    return 'detectWorkflow' in rule || 'collectWorkflowData' in rule;
}
function isInstanceRule(rule) {
    return 'detect' in rule;
}
//# sourceMappingURL=rule.types.js.map