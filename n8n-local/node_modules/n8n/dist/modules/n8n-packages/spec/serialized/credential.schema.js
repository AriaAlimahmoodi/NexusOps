"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializedCredentialSchema = exports.serializedCredentialDataSchema = void 0;
const zod_1 = require("zod");
const utils_1 = require("../../../../utils");
const expressionStringSchema = zod_1.z
    .string()
    .refine(utils_1.containsExpression, { message: 'credential data values must be n8n expressions' });
const serializedCredentialDataValueSchema = zod_1.z.lazy(() => zod_1.z.union([
    expressionStringSchema,
    zod_1.z.array(serializedCredentialDataValueSchema),
    zod_1.z.record(serializedCredentialDataValueSchema),
]));
exports.serializedCredentialDataSchema = zod_1.z.record(serializedCredentialDataValueSchema);
exports.serializedCredentialSchema = zod_1.z
    .object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    data: exports.serializedCredentialDataSchema.optional(),
    dataIsComplete: zod_1.z.boolean().optional(),
})
    .strict();
//# sourceMappingURL=credential.schema.js.map