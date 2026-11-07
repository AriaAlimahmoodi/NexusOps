"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakingChangeRule = void 0;
const di_1 = require("@n8n/di");
const breaking_change_rule_metadata_1 = require("./breaking-change-rule-metadata");
const BreakingChangeRule = (opts) => (target) => {
    di_1.Container.get(breaking_change_rule_metadata_1.BreakingChangeRuleMetadata).register({
        class: target,
        version: opts.version,
    });
    return (0, di_1.Service)()(target);
};
exports.BreakingChangeRule = BreakingChangeRule;
//# sourceMappingURL=breaking-change-rule.js.map