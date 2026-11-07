"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleListQueryDto = void 0;
const boolean_from_string_1 = require("../../schemas/boolean-from-string");
const zod_class_1 = require("../../zod-class");
class RoleListQueryDto extends zod_class_1.Z.class({
    withUsageCount: boolean_from_string_1.booleanFromString.optional().default('false'),
}) {
}
exports.RoleListQueryDto = RoleListQueryDto;
//# sourceMappingURL=role-list-query.dto.js.map