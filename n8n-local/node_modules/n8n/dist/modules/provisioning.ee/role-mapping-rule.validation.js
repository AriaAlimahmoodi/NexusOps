"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertRoleCompatibleWithMappingType = assertRoleCompatibleWithMappingType;
exports.assertAndNormalizeProjectIdsForRuleType = assertAndNormalizeProjectIdsForRuleType;
const errors_1 = require("@n8n/errors");
function assertRoleCompatibleWithMappingType(role, type) {
    if (type === 'instance' && role.roleType !== 'global') {
        throw new errors_1.BadRequestError('Instance mapping rules must use a global role');
    }
    if (type === 'project' && role.roleType !== 'project') {
        throw new errors_1.BadRequestError('Project mapping rules must use a project role');
    }
}
function assertAndNormalizeProjectIdsForRuleType(type, explicitProjectIds, fallbackWhenOmitted) {
    if (type === 'instance') {
        if (explicitProjectIds !== undefined && explicitProjectIds.length > 0) {
            throw new errors_1.BadRequestError('projectIds must be omitted or empty when type is instance');
        }
        return [];
    }
    const ids = explicitProjectIds !== undefined
        ? [...new Set(explicitProjectIds)]
        : [...new Set(fallbackWhenOmitted)];
    if (ids.length === 0) {
        throw new errors_1.BadRequestError('projectIds is required when type is project');
    }
    return ids;
}
//# sourceMappingURL=role-mapping-rule.validation.js.map