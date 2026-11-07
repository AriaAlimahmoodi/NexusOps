"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bearerTokenSchema = exports.taskBrokerAuthRequestBodySchema = void 0;
const zod_1 = require("zod");
exports.taskBrokerAuthRequestBodySchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
});
exports.bearerTokenSchema = zod_1.z
    .string()
    .regex(/^Bearer .+$/i)
    .transform((header) => header.slice('Bearer '.length));
//# sourceMappingURL=task-broker-auth.schema.js.map