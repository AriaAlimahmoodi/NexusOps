"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sensitiveFieldRulesSchema = exports.valueLookupPathSchema = void 0;
const zod_1 = require("zod");
exports.valueLookupPathSchema = zod_1.z.object({
    nodeType: zod_1.z.string().min(1),
    path: zod_1.z.string().min(1),
});
exports.sensitiveFieldRulesSchema = zod_1.z.record(zod_1.z.string().min(1), exports.valueLookupPathSchema);
//# sourceMappingURL=runtime-credentials.schemas.js.map