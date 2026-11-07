"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVariableRequestDto = exports.strictVariableKeySchema = exports.NEW_VARIABLE_KEY_REGEX = void 0;
const zod_1 = require("zod");
const base_dto_1 = require("./base.dto");
exports.NEW_VARIABLE_KEY_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
exports.strictVariableKeySchema = zod_1.z
    .string()
    .min(1, 'key must be at least 1 character long')
    .max(base_dto_1.VARIABLE_KEY_MAX_LENGTH, 'key cannot be longer than 50 characters')
    .regex(exports.NEW_VARIABLE_KEY_REGEX, 'key can only contain letters, numbers (not as first character), and underscores (A-Za-z0-9_)');
class CreateVariableRequestDto extends base_dto_1.BaseVariableRequestDto.extend({
    key: exports.strictVariableKeySchema,
    projectId: zod_1.z.string().max(36).optional(),
}) {
}
exports.CreateVariableRequestDto = CreateVariableRequestDto;
//# sourceMappingURL=create-variable-request.dto.js.map