"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateUserPreferenceTool = void 0;
const api_types_1 = require("@n8n/api-types");
const telemetry_1 = require("@n8n/telemetry");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const user_preference_tool_utils_1 = require("./user-preference-tool.utils");
const DESCRIPTION = [
    'Changes a saved preference: its text, who it applies to, or both. Use it when the user changes or refines a preference that is already saved, instead of saving a second one next to it.',
    `Take the id from ${mcp_constants_1.MCP_GET_USER_PREFERENCES_TOOL_NAME} or from the result of the save. Leave \`scope\` out to keep the preference where it is; only the user decides to move one, so pass \`scope\` when they ask for it and never on your own.`,
    'A move to `project` needs `projectId` from `search_projects`. A move the user may not make is refused with `not_permitted`.',
    'Tell the user what the preference says now and who it applies to, in the same turn.',
].join('\n\n');
const inputSchema = {
    id: zod_1.default.string().min(1).describe('Id of the preference to change.'),
    content: api_types_1.aiPreferenceContentSchema
        .optional()
        .describe('The new text. Leave it out to keep the text and move the preference only.'),
    scope: zod_1.default
        .enum(['user', 'project', 'instance'])
        .optional()
        .describe('Who the preference applies to after the change: `user` the caller in every project, `project` everyone in one project, `instance` everyone on this n8n instance. Leave it out to keep the current scope.'),
    projectId: zod_1.default
        .string()
        .min(1)
        .optional()
        .describe('The project to move the preference to. Required with `scope` `project`.'),
};
const outputSchema = {
    saved: zod_1.default.boolean().describe('True when the preference now carries the new text.'),
    preference: user_preference_tool_utils_1.savedPreferenceSchema.optional().describe('The preference after the edit.'),
    error: zod_1.default.string().optional().describe('Set when the edit was refused or failed.'),
    reason: zod_1.default
        .enum(user_preference_tool_utils_1.PREFERENCE_WRITE_REASONS)
        .optional()
        .describe('Why the edit was refused. `not_found`: no preference with this id is visible to the user; read the preferences again. `duplicate`: another preference in the same scope already has this text. Do not retry the same call.'),
};
const createUpdateUserPreferenceTool = (user, aiPreferenceService, telemetry, urlService, logger) => ({
    name: mcp_constants_1.MCP_UPDATE_USER_PREFERENCE_TOOL_NAME,
    config: {
        description: DESCRIPTION,
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Update User Preference',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ id, content, scope: requestedScope, projectId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: mcp_constants_1.MCP_UPDATE_USER_PREFERENCE_TOOL_NAME,
            parameters: {
                ...(content !== undefined ? { text_length: content.length } : {}),
                ...(requestedScope !== undefined ? { scope: requestedScope } : {}),
            },
        };
        const refuse = (reason, message, textLength) => {
            telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_WRITE_REJECTED, {
                user_id: user.id,
                surface: 'mcp',
                reason: (0, user_preference_tool_utils_1.toRejectedReason)(reason),
                ...(requestedScope !== undefined ? { scope_type: requestedScope } : {}),
                ...(textLength !== undefined ? { text_length: textLength } : {}),
            });
            telemetryPayload.results = { success: false, error: message, data: { reason } };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [
                    {
                        type: 'text',
                        text: `The preference was not changed: ${message}. Do not call this tool again with the same input.`,
                    },
                ],
                structuredContent: { saved: false, error: message, reason },
                isError: true,
            };
        };
        if (content === undefined && requestedScope === undefined) {
            return refuse('failed', 'Name the new text, the new scope, or both');
        }
        if (requestedScope === 'project' && !projectId) {
            return refuse('failed', 'A move to a project needs a projectId');
        }
        let before;
        try {
            before = await aiPreferenceService.getById(user, id);
        }
        catch (error) {
            const { reason, message } = (0, user_preference_tool_utils_1.classifyPreferenceWriteError)(error);
            if (reason === 'failed') {
                logger.error('Reading an AI preference over MCP failed', { error });
            }
            return refuse(reason, message, content?.length);
        }
        const beforeScope = (0, user_preference_tool_utils_1.preferenceScopeOf)(before);
        const text = content ?? before.content;
        const moved = requestedScope !== undefined &&
            (requestedScope !== beforeScope ||
                (requestedScope === 'project' && projectId !== before.projectId));
        let preference;
        try {
            preference = requestedScope
                ? await aiPreferenceService.update(user, id, {
                    content: text,
                    scope: requestedScope,
                    userId: requestedScope === 'user' ? (before.userId ?? user.id) : null,
                    projectId: requestedScope === 'project' ? (projectId ?? null) : null,
                })
                : await aiPreferenceService.updateContent(user, id, text);
        }
        catch (error) {
            const { reason, message } = (0, user_preference_tool_utils_1.classifyPreferenceWriteError)(error);
            if (reason === 'failed') {
                logger.error('Updating an AI preference over MCP failed', { error });
            }
            telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_WRITE_REJECTED, {
                user_id: user.id,
                surface: 'mcp',
                reason: (0, user_preference_tool_utils_1.toRejectedReason)(reason),
                scope_type: requestedScope ?? beforeScope,
                text_length: text.length,
            });
            telemetryPayload.results = { success: false, error: message, data: { reason } };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [
                    {
                        type: 'text',
                        text: `The preference was not changed: ${message}. Do not call this tool again with the same input.`,
                    },
                ],
                structuredContent: { saved: false, error: message, reason },
                isError: true,
            };
        }
        const scope = (0, user_preference_tool_utils_1.preferenceScopeOf)(preference);
        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.ASSISTANT_SAVED_PREFERENCE, {
            user_id: user.id,
            surface: 'mcp',
            scope_type: scope,
            text_length: preference.content.length,
            replaced_existing: true,
        });
        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_CONFIRMATION_RESOLVED, {
            user_id: user.id,
            surface: 'mcp',
            outcome: 'accepted_after_edit',
            scope_type: scope,
            text_length: preference.content.length,
        });
        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.USER_UPDATED_PREFERENCE, {
            user_id: user.id,
            scope_type: scope,
            text_length: preference.content.length,
            scope_changed: moved,
            ...(preference.projectId ? { project_id: preference.projectId } : {}),
            surface: 'mcp',
        });
        if (moved) {
            telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_SCOPE_ACCEPTED, {
                user_id: user.id,
                surface: 'mcp',
                offered_scope: beforeScope,
                accepted_scope: scope,
                scope_changed: true,
            });
        }
        telemetryPayload.results = { success: true, data: { scope, moved } };
        telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
        const url = (0, user_preference_tool_utils_1.preferencesSettingsUrl)(urlService);
        return {
            content: [
                {
                    type: 'text',
                    text: `Preference updated. It now reads "${preference.content}" and applies to ${scopeInWords(scope)}. Tell the user both, and that they can review it at ${url}.`,
                },
            ],
            structuredContent: { saved: true, preference: (0, user_preference_tool_utils_1.toSavedPreferenceOutput)(preference, url) },
        };
    },
});
exports.createUpdateUserPreferenceTool = createUpdateUserPreferenceTool;
function scopeInWords(scope) {
    if (scope === 'instance')
        return 'everyone on this n8n instance';
    if (scope === 'project')
        return 'everyone in the project';
    return 'the user only, in every project';
}
//# sourceMappingURL=update-user-preference.tool.js.map