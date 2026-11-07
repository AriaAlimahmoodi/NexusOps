"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpDiscoveryVisitRequestDto = void 0;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
class McpDiscoveryVisitRequestDto extends api_types_1.Z.class({
    pickedClaude: zod_1.z.boolean().optional(),
    isTrial: zod_1.z.boolean().optional(),
}) {
}
exports.McpDiscoveryVisitRequestDto = McpDiscoveryVisitRequestDto;
//# sourceMappingURL=mcp-discovery.dto.js.map