"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSaveUserPreferenceTool = void 0;
const api_types_1 = require("@n8n/api-types");
const permissions_1 = require("@n8n/permissions");
const telemetry_1 = require("@n8n/telemetry");
const is_record_1 = require("@n8n/utils/is-record");
const lazy_import_1 = require("@n8n/utils/lazy-import");
const zod_1 = __importDefault(require("zod"));
const ai_preference_write_1 = require("../../../services/ai-preference-write");
const mcp_constants_1 = require("../mcp.constants");
const user_preference_tool_utils_1 = require("./user-preference-tool.utils");
const DESCRIPTION = [
    'Saves a preference about how the user likes to work with n8n, so the n8n assistant and every connected AI tool apply it from now on: node and credential choices, naming, how work is organised, patterns to avoid.',
    'Call this only for a durable preference the user states about their way of working, such as "always add an error workflow" or "name nodes in English". Do not call it for an instruction that applies to the current task only, such as "make this one a POST request", and do not infer a preference the user did not state.',
    `Read ${mcp_constants_1.MCP_GET_USER_PREFERENCES_TOOL_NAME} first. If a saved preference already covers the same ground, call ${mcp_constants_1.MCP_UPDATE_USER_PREFERENCE_TOOL_NAME} with its id instead of saving a near-duplicate; saving the exact same text again is refused.`,
    `The preference is saved at once, without a confirmation step. In the same turn, tell the user the exact text that was saved and give them the settings link from the result, so they can check it. If they want it changed, call ${mcp_constants_1.MCP_UPDATE_USER_PREFERENCE_TOOL_NAME}; if they want it gone, call ${mcp_constants_1.MCP_UNDO_USER_PREFERENCE_TOOL_NAME}.`,
].join('\n\n');
const REVIEW_KEY = 'review';
const inputSchema = {
    content: api_types_1.aiPreferenceContentSchema,
};
const outputSchema = {
    saved: zod_1.default
        .boolean()
        .describe('True when a preference is saved when this call returns. False when nothing is.'),
    preference: user_preference_tool_utils_1.savedPreferenceSchema
        .optional()
        .describe('The preference as saved. Absent when `saved` is false.'),
    removed: zod_1.default
        .boolean()
        .optional()
        .describe('True when the user declined the review form that followed the write.'),
    error: zod_1.default.string().optional().describe('Set when the write or the review failed.'),
    reason: zod_1.default
        .enum(user_preference_tool_utils_1.PREFERENCE_WRITE_REASONS)
        .optional()
        .describe('Why the write was refused. `duplicate`: the same text is saved already, read the preferences and update that one. `scope_full`: the user has to remove a preference first. Do not retry the same call.'),
};
const reviewFormSchema = zod_1.default.object({
    text: zod_1.default.string().optional(),
    scope: zod_1.default.enum(['user', 'instance']).optional(),
});
const SCOPE_LABELS = {
    user: 'Just you, in every project',
    instance: 'Everyone on this n8n instance',
};
function supportsFormElicitation(capabilities) {
    const elicitation = (0, is_record_1.isRecord)(capabilities) ? capabilities.elicitation : undefined;
    if (!(0, is_record_1.isRecord)(elicitation))
        return false;
    return 'form' in elicitation || !('url' in elicitation);
}
const createSaveUserPreferenceTool = (user, aiPreferenceService, telemetry, urlService, logger) => ({
    name: mcp_constants_1.MCP_SAVE_USER_PREFERENCE_TOOL_NAME,
    config: {
        description: DESCRIPTION,
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Save User Preference',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    handler: async ({ content }, extra) => {
        const { inputRequired, inputResponse, CLIENT_CAPABILITIES_META_KEY } = await (0, lazy_import_1.lazyImport)(async () => await import('@modelcontextprotocol/server'));
        const ctx = (extra ?? {});
        const canElicit = supportsFormElicitation(ctx.mcpReq?.envelope?.[CLIENT_CAPABILITIES_META_KEY]);
        const review = inputResponse(ctx.mcpReq?.inputResponses, REVIEW_KEY);
        const url = (0, user_preference_tool_utils_1.preferencesSettingsUrl)(urlService);
        const telemetryPayload = {
            user_id: user.id,
            tool_name: mcp_constants_1.MCP_SAVE_USER_PREFERENCE_TOOL_NAME,
            parameters: { text_length: content.length, can_elicit: canElicit },
        };
        const done = (output, text, isError = false) => {
            telemetryPayload.results = isError
                ? { success: false, error: output.error, data: { reason: output.reason } }
                : {
                    success: true,
                    data: {
                        saved: output.saved,
                        removed: output.removed ?? false,
                        review: review.kind === 'elicit' ? review.action : 'none',
                    },
                };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text }],
                structuredContent: output,
                ...(isError ? { isError: true } : {}),
            };
        };
        const savedResult = (preference, lead) => done({ saved: true, preference: (0, user_preference_tool_utils_1.toSavedPreferenceOutput)(preference, url) }, `${lead} Saved text: "${preference.content}". Tell the user this is what was saved and that they can review it at ${url}.`);
        const applyReview = async (id, answer) => {
            const keep = `Tell the user the preference stays as saved and that they can review it at ${url}.`;
            if (answer.action === 'cancel') {
                return done({ saved: true, preference: { id, scope: 'user', text: content, url } }, `The user closed the review without changing the preference. Saved text: "${content}". ${keep}`);
            }
            const form = reviewFormSchema.safeParse(answer.content ?? {});
            const wantsRemoval = answer.action === 'decline';
            const editedText = form.success ? form.data.text?.trim() : undefined;
            const chosenScope = form.success ? form.data.scope : undefined;
            const movedScope = chosenScope && chosenScope !== 'user' ? chosenScope : undefined;
            if (wantsRemoval) {
                try {
                    const removed = await aiPreferenceService.undoWrite(user, id, 'mcp');
                    telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.USER_DELETED_PREFERENCES, {
                        user_id: user.id,
                        count: 1,
                        source: 'rejected',
                        scope_types: ['user'],
                        surface: 'mcp',
                        seconds_since_saved: (0, user_preference_tool_utils_1.secondsSinceSaved)(removed),
                    });
                    telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_CONFIRMATION_RESOLVED, {
                        user_id: user.id,
                        surface: 'mcp',
                        outcome: 'rejected',
                        scope_type: 'user',
                        text_length: removed.content.length,
                    });
                    return done({ saved: false, removed: true }, 'The user removed the preference in the review. Nothing is saved now. Do not save it again unless they ask.');
                }
                catch (error) {
                    const { reason, message } = (0, user_preference_tool_utils_1.classifyPreferenceWriteError)(error);
                    return done({ saved: true, error: message, reason }, `The user asked to remove the preference but the removal failed: ${message}. The preference is still saved. ${keep}`, true);
                }
            }
            const changedText = editedText && editedText !== content ? editedText : undefined;
            if (changedText ?? movedScope) {
                const text = changedText ?? content;
                const parsed = api_types_1.aiPreferenceContentSchema.safeParse(text);
                if (!parsed.success) {
                    const message = `The edited text is longer than ${api_types_1.AI_PREFERENCE_CONTENT_MAX_LENGTH} characters.`;
                    telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_WRITE_REJECTED, {
                        user_id: user.id,
                        surface: 'mcp',
                        reason: 'too_long',
                        scope_type: 'user',
                        text_length: text.length,
                    });
                    return done({
                        saved: true,
                        preference: { id, scope: 'user', text: content, url },
                        error: message,
                        reason: 'too_long',
                    }, `The user edited the preference but the edit was refused: ${message} The original text is still saved: "${content}". ${keep}`, true);
                }
                try {
                    const updated = movedScope
                        ? await aiPreferenceService.update(user, id, {
                            content: parsed.data,
                            scope: movedScope,
                            userId: null,
                            projectId: null,
                        })
                        : await aiPreferenceService.updateContent(user, id, parsed.data);
                    telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_CONFIRMATION_RESOLVED, {
                        user_id: user.id,
                        surface: 'mcp',
                        outcome: 'accepted_after_edit',
                        scope_type: movedScope ?? 'user',
                        text_length: updated.content.length,
                    });
                    telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.USER_UPDATED_PREFERENCE, {
                        user_id: user.id,
                        scope_type: movedScope ?? 'user',
                        text_length: updated.content.length,
                        scope_changed: movedScope !== undefined,
                        surface: 'mcp',
                    });
                    if (movedScope) {
                        telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCE_SCOPE_ACCEPTED, {
                            user_id: user.id,
                            surface: 'mcp',
                            offered_scope: 'user',
                            accepted_scope: movedScope,
                            scope_changed: true,
                        });
                    }
                    return savedResult(updated, movedScope
                        ? `The user moved the preference to: ${SCOPE_LABELS[movedScope]}.`
                        : 'The user edited the preference in the review.');
                }
                catch (error) {
                    const { reason, message } = (0, user_preference_tool_utils_1.classifyPreferenceWriteError)(error);
                    return done({
                        saved: true,
                        preference: { id, scope: 'user', text: content, url },
                        error: message,
                        reason,
                    }, `The user changed the preference but the change was refused: ${message}. It is still saved as "${content}", for the user only. ${keep}`, true);
                }
            }
            return done({ saved: true, preference: { id, scope: 'user', text: content, url } }, `The user kept the preference as saved. Saved text: "${content}". ${keep}`);
        };
        if (review.kind === 'elicit') {
            const id = ctx.mcpReq?.requestState?.();
            if (!(typeof id === 'string' && zod_1.default.string().uuid().safeParse(id).success)) {
                return done({
                    saved: true,
                    error: 'The review answer could not be matched to the saved preference.',
                }, `The preference was saved, but the review answer could not be matched to it. Read ${mcp_constants_1.MCP_GET_USER_PREFERENCES_TOOL_NAME} to find it, and tell the user it is saved at ${url}.`);
            }
            return await applyReview(id, review);
        }
        const written = await (0, ai_preference_write_1.writeAssistantPreference)({
            aiPreferenceService,
            telemetry,
            logger,
            user,
            surface: 'mcp',
            content,
            scope: 'user',
        });
        if (!written.ok) {
            return done({ saved: false, error: written.message, reason: written.reason }, `Nothing was saved: ${written.message}. Do not call this tool again with the same text.`, true);
        }
        const { preference } = written;
        if (!canElicit)
            return savedResult(preference, 'Preference saved.');
        const scopeChoices = (0, permissions_1.hasGlobalScope)(user, 'aiPreference:create')
            ? ['user', 'instance']
            : ['user'];
        return inputRequired({
            inputRequests: {
                [REVIEW_KEY]: inputRequired.elicit({
                    message: `Saved to your n8n preferences. Accept to keep it, or Decline to delete it.\n\n"${preference.content}"\n\nFrom now on, the n8n assistant and your connected AI tools follow this preference. To change it, edit the text${scopeChoices.length > 1 ? ' or who it applies to' : ''}, then accept. If you close this, the preference stays saved.\n\nYou can change or delete it anytime in n8n under Settings > Context > Preferences. To stop this tool from saving preferences, connect it again without the "Save, update and undo AI preferences" permission.`,
                    requestedSchema: {
                        type: 'object',
                        properties: {
                            text: {
                                type: 'string',
                                title: 'Preference',
                                description: "Edit the text to change what's saved.",
                                default: preference.content,
                                maxLength: api_types_1.AI_PREFERENCE_CONTENT_MAX_LENGTH,
                            },
                            ...(scopeChoices.length > 1
                                ? {
                                    scope: {
                                        type: 'string',
                                        title: 'Apply this to',
                                        description: 'Who follows this preference. It is saved for you; change this to share it.',
                                        enum: [...scopeChoices],
                                        enumNames: scopeChoices.map((choice) => SCOPE_LABELS[choice]),
                                        default: 'user',
                                    },
                                }
                                : {}),
                        },
                    },
                }),
            },
            requestState: preference.id,
        });
    },
});
exports.createSaveUserPreferenceTool = createSaveUserPreferenceTool;
//# sourceMappingURL=save-user-preference.tool.js.map