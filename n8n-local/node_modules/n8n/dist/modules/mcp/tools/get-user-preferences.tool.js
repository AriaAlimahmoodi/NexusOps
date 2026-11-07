"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetUserPreferencesTool = void 0;
const telemetry_1 = require("@n8n/telemetry");
const zod_1 = __importDefault(require("zod"));
const ai_preference_service_1 = require("../../../services/ai-preference.service");
const mcp_constants_1 = require("../mcp.constants");
const DESCRIPTION = [
    'Returns the preferences saved for this n8n instance, the caller, and their projects: node and credential choices, naming, how work is organised, and patterns to avoid.',
    `Call this before ${mcp_constants_1.MCP_USER_PREFERENCES_TRIGGER_CLAUSE} and apply what it returns to every change you make for the remainder of the task, not only the first one. If a preference conflicts with something the user asks for directly, follow the user and say which preference you set aside.`,
    'When you work inside one project, pass its `projectId` to leave the other projects out.',
].join('\n\n');
const NOTHING_SAVED = 'No preferences are saved for this instance, for you, or for your projects.';
const NOTHING_SAVED_FOR_PROJECT = 'No preferences are saved for this instance, for you, or for this project.';
const inputSchema = {
    projectId: zod_1.default
        .string()
        .min(1)
        .optional()
        .describe('Read one project instead of every project you can see. The instance and personal preferences are always included. Obtain the id from search_projects.'),
};
const outputSchema = {
    hasPreferences: zod_1.default
        .boolean()
        .describe('False when nothing is saved for the instance, the caller, or their projects, and also false when `error` is set. True when `preferences` holds at least one item.'),
    preferences: zod_1.default
        .array(zod_1.default.object({
        id: zod_1.default
            .string()
            .describe('Stable id of the preference. Name it when you update this preference, so an edit replaces the row instead of adding a second one.'),
        scope: zod_1.default
            .enum(['instance', 'user', 'project'])
            .describe('Where the preference is saved: `instance` is set by an admin for everyone, `user` is what the caller saved for themselves (including on their own personal project), and `project` is a team project named in `project`.'),
        project: zod_1.default
            .string()
            .optional()
            .describe("The team project's name. Set only when scope is `project`."),
        text: zod_1.default.string().describe('The preference as the person wrote it.'),
    }))
        .describe('Every saved preference as its own item, instance first, then personal, then projects. Empty when hasPreferences is false.'),
    error: zod_1.default
        .string()
        .optional()
        .describe('Set when the read failed. The preferences are unknown, not absent: do not build as if none were saved.'),
};
const createGetUserPreferencesTool = (user, aiPreferenceService, telemetry) => ({
    name: mcp_constants_1.MCP_GET_USER_PREFERENCES_TOOL_NAME,
    config: {
        description: DESCRIPTION,
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Get User Preferences',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ projectId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: mcp_constants_1.MCP_GET_USER_PREFERENCES_TOOL_NAME,
            parameters: { projectId },
        };
        try {
            const preferences = projectId
                ? await aiPreferenceService.getApplicableForProject(user, projectId)
                : await aiPreferenceService.getApplicableAcrossProjects(user);
            const items = (0, ai_preference_service_1.flattenAiPreferences)(preferences);
            const hasPreferences = items.length > 0;
            const text = hasPreferences
                ? (0, ai_preference_service_1.renderAiPreferences)(preferences)
                : projectId
                    ? NOTHING_SAVED_FOR_PROJECT
                    : NOTHING_SAVED;
            const scopes = [...new Set(items.map((item) => item.scope))];
            const renderedLength = hasPreferences ? text.length : 0;
            telemetryPayload.results = {
                success: true,
                data: {
                    hasPreferences,
                    count: items.length,
                    scopes,
                    rendered_length: renderedLength,
                },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.PREFERENCES_READ_OVER_MCP, {
                user_id: user.id,
                count: items.length,
                scope_types: scopes,
                rendered_length: renderedLength,
                project_scoped: projectId !== undefined,
            });
            return {
                content: [{ type: 'text', text }],
                structuredContent: { hasPreferences, preferences: items },
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            telemetryPayload.results = { success: false, error: message };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = { hasPreferences: false, preferences: [], error: message };
            return {
                content: [{ type: 'text', text: `Could not read the saved preferences: ${message}` }],
                structuredContent: output,
                isError: true,
            };
        }
    },
});
exports.createGetUserPreferencesTool = createGetUserPreferencesTool;
//# sourceMappingURL=get-user-preferences.tool.js.map