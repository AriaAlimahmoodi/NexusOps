"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCanManageRoleType = assertCanManageRoleType;
exports.canReassignUsers = canReassignUsers;
const permissions_1 = require("@n8n/permissions");
const constants_1 = require("../constants");
const errors_1 = require("@n8n/errors");
function assertCanManageRoleType({ apiKeyScopes, roleType, user, }) {
    const canManage = (scopes) => scopes.includes('role:manage') ||
        (roleType === 'project' && scopes.includes('role:manageProject'));
    const scopes = apiKeyScopes ?? (0, permissions_1.getAuthPrincipalScopes)(user);
    if (!canManage(scopes)) {
        throw new errors_1.ForbiddenError(constants_1.RESPONSE_ERROR_MESSAGES.MISSING_SCOPE);
    }
}
function canReassignUsers({ apiKeyScopes, role, user, }) {
    if (role.roleType !== 'global' || user.role.slug === role.slug) {
        return false;
    }
    const scopes = apiKeyScopes ?? (0, permissions_1.getAuthPrincipalScopes)(user);
    return scopes.includes('role:manage') && scopes.includes('user:changeRole');
}
//# sourceMappingURL=role-authorization.js.map