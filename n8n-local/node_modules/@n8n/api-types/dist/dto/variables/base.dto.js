"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseVariableRequestDto = exports.variableTypeSchema = exports.variableValueSchema = exports.TYPE_DEFAULT = exports.TYPE_ENUM = exports.VALUE_MAX_LENGTH = exports.VARIABLE_KEY_MAX_LENGTH = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
exports.VARIABLE_KEY_MAX_LENGTH = 50;
exports.VALUE_MAX_LENGTH = 1000;
exports.TYPE_ENUM = ['string'];
exports.TYPE_DEFAULT = 'string';
exports.variableValueSchema = zod_1.z
    .string()
    .max(exports.VALUE_MAX_LENGTH, `value cannot be longer than ${exports.VALUE_MAX_LENGTH} characters`);
exports.variableTypeSchema = zod_1.z.enum(exports.TYPE_ENUM).default(exports.TYPE_DEFAULT);
class BaseVariableRequestDto extends zod_class_1.Z.class({
    type: exports.variableTypeSchema,
    value: exports.variableValueSchema,
}) {
}
exports.BaseVariableRequestDto = BaseVariableRequestDto;
//# sourceMappingURL=base.dto.js.map