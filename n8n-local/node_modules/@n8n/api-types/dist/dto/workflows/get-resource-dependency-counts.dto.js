"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetResourceDependencyCountsDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
class GetResourceDependencyCountsDto extends zod_class_1.Z.class({
    resourceIds: zod_1.z.array(zod_1.z.string()).min(1).max(100),
    resourceType: zod_1.z.enum(['workflow', 'credential', 'dataTable']),
}) {
}
exports.GetResourceDependencyCountsDto = GetResourceDependencyCountsDto;
//# sourceMappingURL=get-resource-dependency-counts.dto.js.map