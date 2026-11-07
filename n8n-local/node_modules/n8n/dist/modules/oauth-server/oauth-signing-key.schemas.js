"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicSigningJwkSchema = void 0;
const zod_1 = require("zod");
const api_types_1 = require("@n8n/api-types");
const oauth_signing_key_constants_1 = require("./oauth-signing-key.constants");
exports.PublicSigningJwkSchema = api_types_1.EcPublicJwkSchema.extend({
    use: zod_1.z.literal(oauth_signing_key_constants_1.OAUTH_SIGNING_KEY_USE),
    alg: zod_1.z.literal(oauth_signing_key_constants_1.OAUTH_SIGNING_ALGORITHM),
    crv: zod_1.z.literal(oauth_signing_key_constants_1.OAUTH_SIGNING_CURVE),
});
//# sourceMappingURL=oauth-signing-key.schemas.js.map