"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDestinationQueryDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class TestDestinationQueryDto extends zod_class_1.Z.class({
    id: zod_1.z.string().min(1),
}) {
}
exports.TestDestinationQueryDto = TestDestinationQueryDto;
//# sourceMappingURL=test-destination-query.dto.js.map