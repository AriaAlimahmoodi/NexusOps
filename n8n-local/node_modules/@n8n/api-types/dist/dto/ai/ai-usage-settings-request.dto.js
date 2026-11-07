"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiUsageSettingsRequestDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class AiUsageSettingsRequestDto extends zod_class_1.Z.class({
    allowSendingParameterValues: zod_1.z.boolean(),
}) {
}
exports.AiUsageSettingsRequestDto = AiUsageSettingsRequestDto;
//# sourceMappingURL=ai-usage-settings-request.dto.js.map