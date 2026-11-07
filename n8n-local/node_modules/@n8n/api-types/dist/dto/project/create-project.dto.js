"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateProjectDto = void 0;
const zod_1 = require("zod");
const project_schema_1 = require("../../schemas/project.schema");
const zod_class_1 = require("../../zod-class");
class CreateProjectDto extends zod_class_1.Z.class({
    name: project_schema_1.projectNameSchema,
    icon: project_schema_1.projectIconSchema.optional(),
    uiContext: zod_1.z.string().optional(),
}) {
}
exports.CreateProjectDto = CreateProjectDto;
//# sourceMappingURL=create-project.dto.js.map