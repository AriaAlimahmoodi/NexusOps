"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializedVariableSchema = void 0;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
exports.serializedVariableSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1),
    type: api_types_1.variableTypeSchema,
    value: api_types_1.variableValueSchema.optional(),
})
    .strict();
//# sourceMappingURL=variable.schema.js.map