"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicJweJwkSchema = void 0;
const zod_1 = require("zod");
const api_types_1 = require("@n8n/api-types");
const oauth_jwe_constants_1 = require("./oauth-jwe.constants");
exports.PublicJweJwkSchema = zod_1.z.discriminatedUnion('kty', [
    api_types_1.RsaPublicJwkSchema.extend({
        use: zod_1.z.literal(oauth_jwe_constants_1.JWE_KEY_USE),
        alg: zod_1.z.enum(oauth_jwe_constants_1.JWE_RSA_ALGORITHMS),
    }),
    api_types_1.EcPublicJwkSchema.extend({
        use: zod_1.z.literal(oauth_jwe_constants_1.JWE_KEY_USE),
        alg: zod_1.z.enum(oauth_jwe_constants_1.JWE_EC_ALGORITHMS),
    }),
]);
//# sourceMappingURL=oauth-jwe.schemas.js.map