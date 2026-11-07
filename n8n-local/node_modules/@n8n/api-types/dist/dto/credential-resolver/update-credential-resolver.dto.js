"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCredentialResolverDto = void 0;
const zod_1 = require("zod");
const credential_resolver_schema_1 = require("../../schemas/credential-resolver.schema");
const zod_class_1 = require("../../zod-class");
class UpdateCredentialResolverDto extends zod_class_1.Z.class({
    type: credential_resolver_schema_1.credentialResolverTypeNameSchema.optional(),
    name: credential_resolver_schema_1.credentialResolverNameSchema.optional(),
    config: credential_resolver_schema_1.credentialResolverConfigSchema.optional(),
    clearCredentials: zod_1.z.boolean().optional(),
}) {
}
exports.UpdateCredentialResolverDto = UpdateCredentialResolverDto;
//# sourceMappingURL=update-credential-resolver.dto.js.map