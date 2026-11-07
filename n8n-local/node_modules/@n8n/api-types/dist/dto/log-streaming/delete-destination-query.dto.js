"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteDestinationQueryDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class DeleteDestinationQueryDto extends zod_class_1.Z.class({
    id: zod_1.z.string().min(1),
}) {
}
exports.DeleteDestinationQueryDto = DeleteDestinationQueryDto;
//# sourceMappingURL=delete-destination-query.dto.js.map