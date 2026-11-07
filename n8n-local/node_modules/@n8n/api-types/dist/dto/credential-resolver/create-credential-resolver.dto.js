"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCredentialResolverDto = void 0;
const credential_resolver_schema_1 = require("../../schemas/credential-resolver.schema");
const zod_class_1 = require("../../zod-class");
class CreateCredentialResolverDto extends zod_class_1.Z.class({
    name: credential_resolver_schema_1.credentialResolverNameSchema,
    type: credential_resolver_schema_1.credentialResolverTypeNameSchema,
    config: credential_resolver_schema_1.credentialResolverConfigSchema,
}) {
}
exports.CreateCredentialResolverDto = CreateCredentialResolverDto;
//# sourceMappingURL=create-credential-resolver.dto.js.map