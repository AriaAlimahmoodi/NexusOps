"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSecretsProviderConnectionDto = void 0;
const zod_1 = require("zod");
const secrets_provider_schema_1 = require("../../schemas/secrets-provider.schema");
const zod_class_1 = require("../../zod-class");
class UpdateSecretsProviderConnectionDto extends zod_class_1.Z.class({
    type: secrets_provider_schema_1.secretsProviderTypeSchema.optional(),
    projectIds: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    settings: zod_1.z.object({}).catchall(zod_1.z.any()).optional(),
    isEnabled: zod_1.z.boolean().optional(),
}) {
}
exports.UpdateSecretsProviderConnectionDto = UpdateSecretsProviderConnectionDto;
//# sourceMappingURL=update-secrets-provider-connection.dto.js.map