"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateExternalSecretsSettingsDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class UpdateExternalSecretsSettingsDto extends zod_class_1.Z.class({
    systemRolesEnabled: zod_1.z.boolean(),
}) {
}
exports.UpdateExternalSecretsSettingsDto = UpdateExternalSecretsSettingsDto;
//# sourceMappingURL=update-external-secrets-settings.dto.js.map