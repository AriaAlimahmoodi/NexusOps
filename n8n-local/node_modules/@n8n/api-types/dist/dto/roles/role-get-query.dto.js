"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleGetQueryDto = void 0;
const boolean_from_string_1 = require("../../schemas/boolean-from-string");
const zod_class_1 = require("../../zod-class");
class RoleGetQueryDto extends zod_class_1.Z.class({
    withUsageCount: boolean_from_string_1.booleanFromString.optional().default('false'),
}) {
}
exports.RoleGetQueryDto = RoleGetQueryDto;
//# sourceMappingURL=role-get-query.dto.js.map