"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializedProjectSchema = void 0;
const zod_1 = require("zod");
const projectIconSchema = zod_1.z.object({
    type: zod_1.z.enum(['emoji', 'icon']),
    value: zod_1.z.string(),
});
const customTelemetryTagSchema = zod_1.z.object({
    key: zod_1.z.string(),
    value: zod_1.z.string(),
});
exports.serializedProjectSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    icon: projectIconSchema.optional(),
    customTelemetryTags: zod_1.z.array(customTelemetryTagSchema).optional(),
});
//# sourceMappingURL=project.schema.js.map