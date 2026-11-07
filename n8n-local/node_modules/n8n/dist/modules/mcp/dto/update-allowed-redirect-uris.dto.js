"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAllowedRedirectUrisDto = void 0;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
const isLocalhost = (hostname) => hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
const redirectUriSchema = zod_1.z
    .string()
    .trim()
    .url('Invalid URL format')
    .superRefine((uri, ctx) => {
    const { protocol, hostname } = new URL(uri);
    if (protocol !== 'http:' && protocol !== 'https:') {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: `Invalid protocol for redirect URI: ${uri}. Only http and https are allowed.`,
        });
        return;
    }
    const requiresHttps = process.env.NODE_ENV !== 'development' && !isLocalhost(hostname);
    if (requiresHttps && protocol !== 'https:') {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: `HTTPS required for redirect URI: ${uri}`,
        });
    }
});
class UpdateAllowedRedirectUrisDto extends api_types_1.Z.class({
    uris: zod_1.z.preprocess((value) => Array.isArray(value)
        ? value.filter((item) => typeof item !== 'string' || item.trim().length > 0)
        : value, zod_1.z.array(redirectUriSchema)),
}) {
}
exports.UpdateAllowedRedirectUrisDto = UpdateAllowedRedirectUrisDto;
//# sourceMappingURL=update-allowed-redirect-uris.dto.js.map