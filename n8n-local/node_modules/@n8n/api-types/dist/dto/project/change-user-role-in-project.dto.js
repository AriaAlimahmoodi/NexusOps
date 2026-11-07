"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeUserRoleInProject = void 0;
const permissions_1 = require("@n8n/permissions");
const zod_class_1 = require("../../zod-class");
class ChangeUserRoleInProject extends zod_class_1.Z.class({
    role: permissions_1.assignableProjectRoleSchema,
}) {
}
exports.ChangeUserRoleInProject = ChangeUserRoleInProject;
//# sourceMappingURL=change-user-role-in-project.dto.js.map