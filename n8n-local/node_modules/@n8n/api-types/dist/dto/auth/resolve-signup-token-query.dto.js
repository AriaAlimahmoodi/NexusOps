"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveSignupTokenQueryDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
const resolveSignupTokenShape = {
    token: zod_1.z.string().min(1, 'Token is required'),
};
class ResolveSignupTokenQueryDto extends zod_class_1.Z.class(resolveSignupTokenShape) {
}
exports.ResolveSignupTokenQueryDto = ResolveSignupTokenQueryDto;
//# sourceMappingURL=resolve-signup-token-query.dto.js.map