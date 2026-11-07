"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicClientRegistrationResponseSchema = exports.oAuthAuthorizationServerMetadataSchema = void 0;
const v4_1 = require("zod/v4");
exports.oAuthAuthorizationServerMetadataSchema = v4_1.z.object({
    authorization_endpoint: v4_1.z.url({ protocol: /^https?$/ }),
    token_endpoint: v4_1.z.url({ protocol: /^https?$/ }),
    registration_endpoint: v4_1.z.url({ protocol: /^https?$/ }),
    grant_types_supported: v4_1.z.array(v4_1.z.string()).optional(),
    token_endpoint_auth_methods_supported: v4_1.z.array(v4_1.z.string()).optional(),
    code_challenge_methods_supported: v4_1.z.array(v4_1.z.string()).optional(),
    scopes_supported: v4_1.z.array(v4_1.z.string()).optional(),
});
exports.dynamicClientRegistrationResponseSchema = v4_1.z.object({
    client_id: v4_1.z.string(),
    client_secret: v4_1.z.string().optional(),
});
//# sourceMappingURL=oauth2-dynamic-client-registration.schema.js.map