"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUsersToProjectDto = void 0;
const zod_1 = require("zod");
const project_schema_1 = require("../../schemas/project.schema");
const zod_class_1 = require("../../zod-class");
class AddUsersToProjectDto extends zod_class_1.Z.class({
    relations: zod_1.z.array(project_schema_1.projectRelationSchema).min(1),
}) {
}
exports.AddUsersToProjectDto = AddUsersToProjectDto;
//# sourceMappingURL=add-users-to-project.dto.js.map