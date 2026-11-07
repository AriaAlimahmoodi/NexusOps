"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetQuickConnectApiKeyDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class GetQuickConnectApiKeyDto extends zod_class_1.Z.class({
    quickConnectType: zod_1.z.string().min(1).max(128),
}) {
}
exports.GetQuickConnectApiKeyDto = GetQuickConnectApiKeyDto;
//# sourceMappingURL=create-quick-connect-credential.dto.js.map