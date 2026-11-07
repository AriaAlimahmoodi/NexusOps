"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolvePasswordTokenQueryDto = void 0;
const password_reset_token_schema_1 = require("../../schemas/password-reset-token.schema");
const zod_class_1 = require("../../zod-class");
class ResolvePasswordTokenQueryDto extends zod_class_1.Z.class({
    token: password_reset_token_schema_1.passwordResetTokenSchema,
}) {
}
exports.ResolvePasswordTokenQueryDto = ResolvePasswordTokenQueryDto;
//# sourceMappingURL=resolve-password-token-query.dto.js.map