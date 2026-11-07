"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializedWorkflowMetadataSchema = void 0;
const zod_1 = require("zod");
exports.serializedWorkflowMetadataSchema = zod_1.z.object({
    versionId: zod_1.z.string(),
    publishedVersionId: zod_1.z.string().min(1).nullable(),
});
//# sourceMappingURL=workflow-metadata.schema.js.map