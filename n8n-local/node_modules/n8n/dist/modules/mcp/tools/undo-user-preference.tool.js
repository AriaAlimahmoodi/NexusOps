"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUndoUserPreferenceTool = void 0;
const telemetry_1 = require("@n8n/telemetry");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const user_preference_tool_utils_1 = require("./user-preference-tool.utils");
const DESCRIPTION = [
    `Removes a preference that ${mcp_constants_1.MCP_SAVE_USER_PREFERENCE_TOOL_NAME} saved for this user. Call it when the user takes back a preference that was just saved, or asks to forget one that a connected AI tool saved earlier.`,
    'It only removes preferences saved through a connected AI tool for this user. A preference the user wrote in n8n settings, or one saved for a project or the whole instance, is refused; the user removes those in settings.',
    'Tell the user in the same turn that the preference is gone.',
].join('\n\n');
const inputSchema = {
    id: zod_1.default.string().min(1).describe('Id of the preference to remove, from the save result.'),
};
const outputSchema = {
    removed: zod_1.default.boolean().describe('True when the preference is gone.'),
    id: zod_1.default.string().describe('The id that was asked for.'),
    error: zod_1.default.string().optional().describe('Set when the removal was refused or failed.'),
    reason: zod_1.default
        .enum(['not_found', 'not_permitted', 'failed'])
        .optional()
        .describe('`not_found`: no preference with this id was saved through a connected AI tool for this user. Do not retry.'),
};
const createUndoUserPreferenceTool = (user, aiPreferenceService, telemetry, logger) => ({
    name: mcp_constants_1.MCP_UNDO_USER_PREFERENCE_TOOL_NAME,
    config: {
        description: DESCRIPTION,
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Undo Saved Preference',
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ id }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: mcp_constants_1.MCP_UNDO_USER_PREFERENCE_TOOL_NAME,
            parameters: {},
        };
        let removed;
        try {
            removed = await aiPreferenceService.undoWrite(user, id, 'mcp');
        }
        catch (error) {
            const classified = (0, user_preference_tool_utils_1.classifyPreferenceWriteError)(error);
            const reason = classified.reason === 'not_found' || classified.reason === 'not_permitted'
                ? classified.reason
                : 'failed';
            if (reason === 'failed') {
                logger.error('Removing an AI preference over MCP failed', { error });
            }
            const message = reason === 'failed' ? 'The preference could not be removed.' : classified.message;
            telemetryPayload.results = { success: false, error: message, data: { reason } };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [
                    {
                        type: 'text',
                        text: `The preference was not removed: ${message}. Do not call this tool again with the same id; the user can remove preferences in n8n settings.`,
                    },
                ],
                structuredContent: { removed: false, id, error: message, reason },
                isError: true,
            };
        }
        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.USER_DELETED_PREFERENCES, {
            user_id: user.id,
            count: 1,
            source: 'rejected',
            scope_types: [(0, user_preference_tool_utils_1.preferenceScopeOf)(removed)],
            surface: 'mcp',
            seconds_since_saved: (0, user_preference_tool_utils_1.secondsSinceSaved)(removed),
        });
        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_CONFIRMATION_RESOLVED, {
            user_id: user.id,
            surface: 'mcp',
            outcome: 'rejected',
            scope_type: (0, user_preference_tool_utils_1.preferenceScopeOf)(removed),
            text_length: removed.content.length,
        });
        telemetryPayload.results = { success: true, data: { removed: true } };
        telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
        return {
            content: [
                {
                    type: 'text',
                    text: 'The preference was removed. Nothing is saved for it now; tell the user so.',
                },
            ],
            structuredContent: { removed: true, id },
        };
    },
});
exports.createUndoUserPreferenceTool = createUndoUserPreferenceTool;
//# sourceMappingURL=undo-user-preference.tool.js.map