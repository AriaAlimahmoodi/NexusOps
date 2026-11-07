"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleAssignmentsResponseDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
const roleProjectAssignmentSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    projectName: zod_1.z.string(),
    projectIcon: zod_1.z
        .object({
        type: zod_1.z.string(),
        value: zod_1.z.string(),
    })
        .nullable(),
    memberCount: zod_1.z.number(),
    lastAssigned: zod_1.z.string().nullable(),
});
class RoleAssignmentsResponseDto extends zod_class_1.Z.class({
    projects: zod_1.z.array(roleProjectAssignmentSchema),
    totalProjects: zod_1.z.number(),
}) {
}
exports.RoleAssignmentsResponseDto = RoleAssignmentsResponseDto;
//# sourceMappingURL=role-assignments-response.dto.js.map