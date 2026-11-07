"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleChangeRequestDto = void 0;
const permissions_1 = require("@n8n/permissions");
const zod_class_1 = require("../../zod-class");
class RoleChangeRequestDto extends zod_class_1.Z.class({
    newRoleName: permissions_1.assignableGlobalRoleSchema
        .nullish()
        .refine((val) => val !== null && typeof val !== 'undefined', {
        message: 'New role is required',
    }),
}) {
}
exports.RoleChangeRequestDto = RoleChangeRequestDto;
//# sourceMappingURL=role-change-request.dto.js.map