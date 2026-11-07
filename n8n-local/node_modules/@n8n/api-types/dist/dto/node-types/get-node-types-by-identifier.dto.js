"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNodeTypesByIdentifierRequestDto = void 0;
const zod_1 = require("zod");
const zod_class_1 = require("../../zod-class");
const nodeTypeIdentifierSchema = zod_1.z
    .string()
    .regex(/^[\w.-]+@\d+(\.\d+)?(\.\d+)?$/, 'Invalid node type identifier format. Expected "name@version"');
class GetNodeTypesByIdentifierRequestDto extends zod_class_1.Z.class({
    identifiers: zod_1.z.array(nodeTypeIdentifierSchema).min(1).max(1000),
}) {
}
exports.GetNodeTypesByIdentifierRequestDto = GetNodeTypesByIdentifierRequestDto;
//# sourceMappingURL=get-node-types-by-identifier.dto.js.map