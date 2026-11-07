"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportWorkflowFromUrlDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class ImportWorkflowFromUrlDto extends zod_class_1.Z.class({
    url: zod_1.z.string().url(),
    projectId: zod_1.z.string(),
}) {
}
exports.ImportWorkflowFromUrlDto = ImportWorkflowFromUrlDto;
//# sourceMappingURL=import-workflow-from-url.dto.js.map