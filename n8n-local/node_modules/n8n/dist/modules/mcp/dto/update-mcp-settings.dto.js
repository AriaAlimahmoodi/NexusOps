"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMcpSettingsDto = void 0;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
const updateMcpSettingsShape = {
    mcpAccessEnabled: zod_1.z.boolean().optional(),
    autoExposeNewWorkflows: zod_1.z.boolean().optional(),
};
const updateMcpSettingsSchema = zod_1.z
    .object(updateMcpSettingsShape)
    .refine((value) => value.mcpAccessEnabled !== undefined || value.autoExposeNewWorkflows !== undefined, { message: 'Provide at least one of mcpAccessEnabled or autoExposeNewWorkflows' });
class UpdateMcpSettingsDto extends api_types_1.Z.class(updateMcpSettingsShape) {
    constructor(data) {
        super(updateMcpSettingsSchema.parse(data));
    }
    static safeParse(data) {
        return updateMcpSettingsSchema.safeParse(data);
    }
    static parse(data) {
        return updateMcpSettingsSchema.parse(data);
    }
}
exports.UpdateMcpSettingsDto = UpdateMcpSettingsDto;
//# sourceMappingURL=update-mcp-settings.dto.js.map