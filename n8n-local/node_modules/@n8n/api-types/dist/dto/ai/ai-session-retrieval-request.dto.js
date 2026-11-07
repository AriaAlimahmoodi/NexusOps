"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiSessionRetrievalRequestDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class AiSessionRetrievalRequestDto extends zod_class_1.Z.class({
    workflowId: zod_1.z.string().optional(),
    codeBuilder: zod_1.z.boolean().optional(),
}) {
}
exports.AiSessionRetrievalRequestDto = AiSessionRetrievalRequestDto;
//# sourceMappingURL=ai-session-retrieval-request.dto.js.map