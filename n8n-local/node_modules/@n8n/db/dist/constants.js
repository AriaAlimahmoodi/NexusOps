"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_ROLES = exports.GLOBAL_ROLES = exports.PROJECT_CHAT_USER_ROLE = exports.PROJECT_VIEWER_ROLE = exports.PROJECT_EDITOR_ROLE = exports.PROJECT_ADMIN_ROLE = exports.PROJECT_OWNER_ROLE = exports.GLOBAL_CHAT_USER_ROLE = exports.GLOBAL_MEMBER_ROLE = exports.GLOBAL_ADMIN_ROLE = exports.GLOBAL_OWNER_ROLE = exports.ALL_BUILTIN_ROLES = void 0;
exports.builtInRoleToRoleObject = builtInRoleToRoleObject;
const permissions_1 = require("@n8n/permissions");
function builtInRoleToRoleObject(role, roleType) {
    return {
        slug: role.slug,
        displayName: role.displayName,
        scopes: role.scopes.map((scope) => {
            return {
                slug: scope,
                displayName: scope,
                description: null,
            };
        }),
        systemRole: true,
        roleType,
        description: role.description,
    };
}
function toRoleMap(allRoles) {
    return allRoles.reduce((acc, role) => {
        acc[role.slug] = role;
        return acc;
    }, {});
}
exports.ALL_BUILTIN_ROLES = toRoleMap([
    ...permissions_1.ALL_ROLES.global.map((role) => builtInRoleToRoleObject(role, 'global')),
    ...permissions_1.ALL_ROLES.project.map((role) => builtInRoleToRoleObject(role, 'project')),
    ...permissions_1.ALL_ROLES.credential.map((role) => builtInRoleToRoleObject(role, 'credential')),
    ...permissions_1.ALL_ROLES.workflow.map((role) => builtInRoleToRoleObject(role, 'workflow')),
]);
exports.GLOBAL_OWNER_ROLE = exports.ALL_BUILTIN_ROLES['global:owner'];
exports.GLOBAL_ADMIN_ROLE = exports.ALL_BUILTIN_ROLES['global:admin'];
exports.GLOBAL_MEMBER_ROLE = exports.ALL_BUILTIN_ROLES['global:member'];
exports.GLOBAL_CHAT_USER_ROLE = exports.ALL_BUILTIN_ROLES['global:chatUser'];
exports.PROJECT_OWNER_ROLE = exports.ALL_BUILTIN_ROLES[permissions_1.PROJECT_OWNER_ROLE_SLUG];
exports.PROJECT_ADMIN_ROLE = exports.ALL_BUILTIN_ROLES[permissions_1.PROJECT_ADMIN_ROLE_SLUG];
exports.PROJECT_EDITOR_ROLE = exports.ALL_BUILTIN_ROLES[permissions_1.PROJECT_EDITOR_ROLE_SLUG];
exports.PROJECT_VIEWER_ROLE = exports.ALL_BUILTIN_ROLES[permissions_1.PROJECT_VIEWER_ROLE_SLUG];
exports.PROJECT_CHAT_USER_ROLE = exports.ALL_BUILTIN_ROLES[permissions_1.PROJECT_CHAT_USER_ROLE_SLUG];
exports.GLOBAL_ROLES = {
    'global:owner': exports.GLOBAL_OWNER_ROLE,
    'global:admin': exports.GLOBAL_ADMIN_ROLE,
    'global:member': exports.GLOBAL_MEMBER_ROLE,
    'global:chatUser': exports.GLOBAL_CHAT_USER_ROLE,
};
exports.PROJECT_ROLES = {
    [permissions_1.PROJECT_OWNER_ROLE_SLUG]: exports.PROJECT_OWNER_ROLE,
    [permissions_1.PROJECT_ADMIN_ROLE_SLUG]: exports.PROJECT_ADMIN_ROLE,
    [permissions_1.PROJECT_EDITOR_ROLE_SLUG]: exports.PROJECT_EDITOR_ROLE,
    [permissions_1.PROJECT_VIEWER_ROLE_SLUG]: exports.PROJECT_VIEWER_ROLE,
    [permissions_1.PROJECT_CHAT_USER_ROLE_SLUG]: exports.PROJECT_CHAT_USER_ROLE,
};
//# sourceMappingURL=constants.js.map