"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIENCE_MISMATCH_MESSAGE = exports.AUDIENCE_NOT_DECLARED_MESSAGE = exports.OAuth2OptionsSchema = void 0;
exports.sha256 = sha256;
exports.assertAudience = assertAudience;
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = __importDefault(require("zod"));
const identifier_interface_1 = require("./identifier-interface");
exports.OAuth2OptionsSchema = zod_1.default.object({
    metadataUri: zod_1.default.string().url(),
    subjectClaim: zod_1.default.string().optional().default('sub'),
    expectedAudience: zod_1.default
        .string()
        .trim()
        .optional()
        .transform((value) => (value === '' ? undefined : value)),
});
function sha256(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function collectAudienceClaims(claims) {
    const value = claims.aud;
    if (typeof value === 'string') {
        return [value];
    }
    if (Array.isArray(value)) {
        return value.filter((entry) => typeof entry === 'string');
    }
    return [];
}
exports.AUDIENCE_NOT_DECLARED_MESSAGE = 'Token declares no audience, so it cannot be confirmed as issued for this instance';
exports.AUDIENCE_MISMATCH_MESSAGE = 'Token was not issued for the expected audience';
function assertAudience(claims, expectedAudience) {
    const audiences = collectAudienceClaims(claims);
    if (audiences.length === 0) {
        throw new identifier_interface_1.IdentifierValidationError(exports.AUDIENCE_NOT_DECLARED_MESSAGE);
    }
    if (!audiences.includes(expectedAudience)) {
        throw new identifier_interface_1.IdentifierValidationError(exports.AUDIENCE_MISMATCH_MESSAGE);
    }
}
//# sourceMappingURL=oauth2-utils.js.map