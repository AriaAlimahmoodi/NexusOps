"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListTagsTool = void 0;
exports.listTags = listTags;
const permissions_1 = require("@n8n/permissions");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const schemas_1 = require("./schemas");
const tool_error_utils_1 = require("./tool-error.utils");
const MAX_RESULTS = 500;
const inputSchema = {
    limit: (0, schemas_1.createLimitSchema)(MAX_RESULTS),
};
const outputSchema = {
    data: zod_1.default
        .array(zod_1.default.object({
        id: zod_1.default.string().describe('The unique identifier of the tag'),
        name: zod_1.default.string().describe('The display name of the tag'),
        usageCount: zod_1.default
            .number()
            .int()
            .min(0)
            .describe('Number of non-archived workflows using this tag'),
        createdAt: zod_1.default.string().describe('The ISO timestamp when the tag was created'),
        updatedAt: zod_1.default.string().describe('The ISO timestamp when the tag was last updated'),
    }))
        .describe('Workflow tags available in the instance'),
    count: zod_1.default.number().int().min(0).describe('Number of tags returned'),
    totalCount: zod_1.default.number().int().min(0).describe('Total number of tags before applying the limit'),
};
const createListTagsTool = (user, tagService, telemetry) => ({
    name: 'list_workflow_tags',
    config: {
        description: 'List all workflow tags in the instance.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'List Workflow Tags',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ limit = MAX_RESULTS }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'list_workflow_tags',
            parameters: { limit },
        };
        try {
            if (!(0, permissions_1.hasGlobalScope)(user, 'tag:list')) {
                throw new Error('User does not have permission to list tags');
            }
            const payload = await listTags(tagService, { limit });
            telemetryPayload.results = {
                success: true,
                data: { count: payload.count },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(payload) }],
                structuredContent: payload,
            };
        }
        catch (error) {
            (0, tool_error_utils_1.trackAndRethrowToolError)(telemetry, telemetryPayload, error);
        }
    },
});
exports.createListTagsTool = createListTagsTool;
async function listTags(tagService, { limit = MAX_RESULTS } = {}) {
    const safeLimit = Math.min(Math.max(1, limit), MAX_RESULTS);
    const { data: tags, totalCount } = await tagService.listWithUsageCount({ limit: safeLimit });
    const data = tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        usageCount: tag.usageCount ?? 0,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
    }));
    return { data, count: data.length, totalCount };
}
//# sourceMappingURL=list-tags.tool.js.map