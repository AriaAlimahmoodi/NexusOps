"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetSecretsProviderConnectionIsEnabledDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class SetSecretsProviderConnectionIsEnabledDto extends zod_class_1.Z.class({
    isEnabled: zod_1.z.boolean(),
}) {
}
exports.SetSecretsProviderConnectionIsEnabledDto = SetSecretsProviderConnectionIsEnabledDto;
//# sourceMappingURL=set-secrets-provider-connection-is-enabled.dto.js.map