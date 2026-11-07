"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRoleDto = void 0;
const permissions_1 = require("@n8n/permissions");
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class UpdateRoleDto extends zod_class_1.Z.class({
    displayName: zod_1.z.string().min(2).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    scopes: zod_1.z.array(permissions_1.scopeSchema).optional(),
}) {
}
exports.UpdateRoleDto = UpdateRoleDto;
//# sourceMappingURL=update-role.dto.js.map