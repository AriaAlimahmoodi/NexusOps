"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiClearSessionRequestDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class AiClearSessionRequestDto extends zod_class_1.Z.class({
    workflowId: zod_1.z.string(),
}) {
}
exports.AiClearSessionRequestDto = AiClearSessionRequestDto;
//# sourceMappingURL=ai-clear-session-request.dto.js.map