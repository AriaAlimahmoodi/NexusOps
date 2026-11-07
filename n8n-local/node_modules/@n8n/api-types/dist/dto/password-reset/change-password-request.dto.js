"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordRequestDto = void 0;
const zod_1 = require("zod");
const password_reset_token_schema_1 = require("../../schemas/password-reset-token.schema");
const password_schema_1 = require("../../schemas/password.schema");
const zod_class_1 = require("../../zod-class");
class ChangePasswordRequestDto extends zod_class_1.Z.class({
    token: password_reset_token_schema_1.passwordResetTokenSchema,
    password: password_schema_1.passwordSchema,
    mfaCode: zod_1.z.string().optional(),
}) {
}
exports.ChangePasswordRequestDto = ChangePasswordRequestDto;
//# sourceMappingURL=change-password-request.dto.js.map