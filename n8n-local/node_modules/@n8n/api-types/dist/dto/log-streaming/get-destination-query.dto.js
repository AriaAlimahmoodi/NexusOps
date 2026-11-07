"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDestinationQueryDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class GetDestinationQueryDto extends zod_class_1.Z.class({
    id: zod_1.z.string().min(1).optional(),
}) {
}
exports.GetDestinationQueryDto = GetDestinationQueryDto;
//# sourceMappingURL=get-destination-query.dto.js.map