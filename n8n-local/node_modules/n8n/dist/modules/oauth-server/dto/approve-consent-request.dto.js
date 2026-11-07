"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApproveConsentRequestDto = void 0;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
class ApproveConsentRequestDto extends api_types_1.Z.class({
    approved: zod_1.z.boolean(),
    scopes: zod_1.z
        .array(zod_1.z.string().max(64))
        .max(256)
        .refine((scopes) => new Set(scopes).size === scopes.length, {
        message: 'scopes must not contain duplicates',
    })
        .optional(),
    flow: zod_1.z.string().max(64),
}) {
}
exports.ApproveConsentRequestDto = ApproveConsentRequestDto;
//# sourceMappingURL=approve-consent-request.dto.js.map