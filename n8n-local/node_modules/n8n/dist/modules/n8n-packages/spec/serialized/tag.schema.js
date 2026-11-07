"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializedTagSchema = void 0;
const zod_1 = require("zod");
exports.serializedTagSchema = zod_1.z
    .object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
})
    .strict();
//# sourceMappingURL=tag.schema.js.map