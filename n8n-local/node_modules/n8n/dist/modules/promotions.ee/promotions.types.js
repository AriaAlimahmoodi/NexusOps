"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionTokenAuthPayloadSchema = exports.promotionSshKeyAuthPayloadSchema = void 0;
const zod_1 = require("zod");
exports.promotionSshKeyAuthPayloadSchema = zod_1.z
    .object({ schemaVersion: zod_1.z.literal(1), privateKey: zod_1.z.string().min(1) })
    .strict();
exports.promotionTokenAuthPayloadSchema = zod_1.z
    .object({
    schemaVersion: zod_1.z.literal(1),
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
})
    .strict();
//# sourceMappingURL=promotions.types.js.map