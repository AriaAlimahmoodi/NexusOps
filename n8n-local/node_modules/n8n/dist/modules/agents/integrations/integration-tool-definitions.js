"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_INTEGRATION_ACTION_TOOL_DEFINITIONS = exports.DEFAULT_INTEGRATION_CONTEXT_TOOL_DEFINITIONS = exports.GENERIC_ACTION_TOOL_DEFINITIONS = exports.GENERIC_CONTEXT_QUERY_TOOL_DEFINITIONS = exports.messageSchema = void 0;
exports.resolveIntegrationContextQueryDefinitions = resolveIntegrationContextQueryDefinitions;
exports.resolveIntegrationActionDefinitions = resolveIntegrationActionDefinitions;
exports.actionNeedsApproval = actionNeedsApproval;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
const linear_tool_definitions_1 = require("./platforms/linear-tool-definitions");
const _assertRichCardButtonStylesAreChatSdkStyles = true;
void _assertRichCardButtonStylesAreChatSdkStyles;
exports.messageSchema = api_types_1.richMessageSchema;
const noInputSchema = zod_1.z.object({}).strict();
const platformUserIdSchema = zod_1.z
    .string()
    .min(1)
    .describe('Platform user ID, for example a Slack U... ID or Linear user UUID. Do not pass a name.');
const platformChannelIdSchema = zod_1.z
    .string()
    .min(1)
    .describe('Platform channel ID, for example a Slack C... channel ID. Do not pass a name.');
const searchLimitSchema = zod_1.z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe('Maximum number of matches to return. Defaults to 10.');
const searchCursorSchema = zod_1.z
    .string()
    .min(1)
    .optional()
    .describe('Opaque pagination cursor returned as `nextCursor` by a previous call. Pass to fetch the next page of matches.');
const getCurrentMessageContextInputSchema = zod_1.z.object({
    query: zod_1.z.literal('get_current_message_context'),
    input: noInputSchema,
});
const getCurrentSubjectInputSchema = zod_1.z.object({
    query: zod_1.z.literal('get_current_subject'),
    input: noInputSchema,
});
const getCurrentUserInputSchema = zod_1.z.object({
    query: zod_1.z.literal('get_current_user'),
    input: noInputSchema,
});
const getCurrentChannelInfoInputSchema = zod_1.z.object({
    query: zod_1.z.literal('get_current_channel_info'),
    input: noInputSchema,
});
const getUserInputSchema = zod_1.z.object({
    query: zod_1.z.literal('get_user'),
    input: zod_1.z
        .object({
        userId: platformUserIdSchema,
    })
        .strict(),
});
const getChannelInfoInputSchema = zod_1.z.object({
    query: zod_1.z.literal('get_channel_info'),
    input: zod_1.z
        .object({
        channelId: platformChannelIdSchema,
    })
        .strict(),
});
const searchUsersInputSchema = zod_1.z.object({
    query: zod_1.z.literal('search_users'),
    input: zod_1.z
        .object({
        query: zod_1.z
            .string()
            .min(1)
            .optional()
            .describe('User name, display name, handle, user ID, or email fragment to search for.'),
        email: zod_1.z.string().min(1).optional().describe('Exact email address to look up when known.'),
        limit: searchLimitSchema,
        cursor: searchCursorSchema,
        includeBots: zod_1.z
            .boolean()
            .optional()
            .describe('Whether to include bot users. Defaults to false.'),
        includeDeleted: zod_1.z
            .boolean()
            .optional()
            .describe('Whether to include deleted/deactivated users. Defaults to false.'),
    })
        .strict()
        .refine((input) => input.query !== undefined || input.email !== undefined, {
        message: 'Provide query or email.',
    }),
});
const searchChannelsInputSchema = zod_1.z.object({
    query: zod_1.z.literal('search_channels'),
    input: zod_1.z
        .object({
        query: zod_1.z.string().min(1).describe('Channel name, channel ID, or #channel search term.'),
        limit: searchLimitSchema,
        cursor: searchCursorSchema,
        includeArchived: zod_1.z
            .boolean()
            .optional()
            .describe('Whether to include archived channels. Defaults to false.'),
    })
        .strict(),
});
const respondActionInputSchema = zod_1.z.object({
    action: zod_1.z.literal('respond'),
    input: zod_1.z
        .object({
        message: exports.messageSchema,
    })
        .strict(),
});
const sendDmActionInputSchema = zod_1.z.object({
    action: zod_1.z.literal('send_dm'),
    input: zod_1.z
        .object({
        userId: platformUserIdSchema,
        message: exports.messageSchema,
    })
        .strict(),
});
const sendChannelMessageActionInputSchema = zod_1.z.object({
    action: zod_1.z.literal('send_channel_message'),
    input: zod_1.z
        .object({
        channelId: platformChannelIdSchema,
        message: exports.messageSchema,
    })
        .strict(),
});
const editMessageActionInputSchema = zod_1.z.object({
    action: zod_1.z.literal('edit_message'),
    input: zod_1.z
        .object({
        messageId: zod_1.z
            .string()
            .min(1)
            .describe('Message ID returned by a previous action or get_current_message_context.'),
        message: exports.messageSchema,
    })
        .strict(),
});
const addReactionActionInputSchema = zod_1.z.object({
    action: zod_1.z.literal('add_reaction'),
    input: zod_1.z
        .object({
        emoji: zod_1.z.string().min(1).describe('Emoji name, shortcode, or Unicode emoji to add.'),
        threadId: zod_1.z
            .string()
            .min(1)
            .optional()
            .describe('Optional platform thread ID. Defaults to the latest message context.'),
        messageId: zod_1.z
            .string()
            .min(1)
            .optional()
            .describe('Optional platform message ID. Defaults to the latest message context.'),
    })
        .strict(),
});
const doNotRespondActionInputSchema = zod_1.z.object({
    action: zod_1.z.literal('do_not_respond'),
    input: noInputSchema,
});
exports.GENERIC_CONTEXT_QUERY_TOOL_DEFINITIONS = [
    {
        name: 'get_current_message_context',
        inputSchema: getCurrentMessageContextInputSchema,
        description: 'get_current_message_context: no input. Returns the latest place this agent communicated in this thread and any allow-listed platformMessage metadata. For Slack, context.agentUserId is the bot user ID for this agent; do not look it up as another user.',
    },
    {
        name: 'get_current_subject',
        inputSchema: getCurrentSubjectInputSchema,
        description: 'get_current_subject: no input. Returns the subject of the latest message context, such as a Linear issue, when available.',
    },
    {
        name: 'get_current_user',
        inputSchema: getCurrentUserInputSchema,
        description: 'get_current_user: no input. Returns the latest user who interacted in the current message context.',
    },
    {
        name: 'get_current_channel_info',
        inputSchema: getCurrentChannelInfoInputSchema,
        description: 'get_current_channel_info: no input. Returns metadata for the latest channel in the current message context.',
    },
    {
        name: 'get_user',
        inputSchema: getUserInputSchema,
        description: 'get_user: input.userId is required. Use a platform user ID such as a Slack U... ID or Linear user UUID, not a name, handle, or email.',
    },
    {
        name: 'get_channel_info',
        inputSchema: getChannelInfoInputSchema,
        description: 'get_channel_info: input.channelId is required. Use a platform channel ID such as a Slack C... ID, not a channel name.',
    },
    {
        name: 'search_users',
        inputSchema: searchUsersInputSchema,
        description: 'search_users: input.query or input.email is required. Returns matching platform user IDs for names, handles, or emails. When the response includes nextCursor, pass it back as input.cursor to fetch the next page.',
    },
    {
        name: 'search_channels',
        inputSchema: searchChannelsInputSchema,
        description: 'search_channels: input.query is required. Returns matching platform channel IDs for channel names or IDs. When the response includes nextCursor, pass it back as input.cursor to fetch the next page.',
    },
];
exports.GENERIC_ACTION_TOOL_DEFINITIONS = [
    {
        name: 'respond',
        inputSchema: respondActionInputSchema,
        description: 'respond: input.message is required. Responds in the latest message context for this integration connection.',
    },
    {
        name: 'send_dm',
        inputSchema: sendDmActionInputSchema,
        sensitive: true,
        description: 'send_dm: input.userId and input.message are required. userId must be a platform user ID, not a name, handle, or email.',
    },
    {
        name: 'send_channel_message',
        inputSchema: sendChannelMessageActionInputSchema,
        sensitive: true,
        description: 'send_channel_message: input.channelId and input.message are required. channelId must be a platform channel ID, not a channel name.',
    },
];
const EDIT_MESSAGE_ACTION_TOOL_DEFINITIONS = [
    {
        name: 'edit_message',
        inputSchema: editMessageActionInputSchema,
        sensitive: true,
        description: "edit_message: input.messageId and input.message are required. Uses the latest message context to choose the conversation, so input.threadId isn't accepted.",
    },
];
const OPT_IN_ACTION_TOOL_DEFINITIONS = [
    {
        name: 'add_reaction',
        inputSchema: addReactionActionInputSchema,
        description: 'add_reaction: input.emoji is required. Optional input.threadId and input.messageId target a specific message; otherwise the latest message context is used.',
    },
    {
        name: 'do_not_respond',
        inputSchema: doNotRespondActionInputSchema,
        description: 'do_not_respond: no input. Ends the turn without sending any message. Use only for messages in subscribed group channels or threads that need no reaction from you, or when the user explicitly asked you not to reply. Never use it for direct messages or direct mentions. After calling it, stop immediately — do not write any text and never post a message saying you are staying silent.',
    },
];
exports.DEFAULT_INTEGRATION_CONTEXT_TOOL_DEFINITIONS = exports.GENERIC_CONTEXT_QUERY_TOOL_DEFINITIONS;
exports.DEFAULT_INTEGRATION_ACTION_TOOL_DEFINITIONS = exports.GENERIC_ACTION_TOOL_DEFINITIONS;
const ALL_CONTEXT_QUERY_TOOL_DEFINITIONS = [
    ...exports.GENERIC_CONTEXT_QUERY_TOOL_DEFINITIONS,
    ...linear_tool_definitions_1.LINEAR_CONTEXT_QUERY_TOOL_DEFINITIONS,
];
const ALL_ACTION_TOOL_DEFINITIONS = [
    ...exports.GENERIC_ACTION_TOOL_DEFINITIONS,
    ...EDIT_MESSAGE_ACTION_TOOL_DEFINITIONS,
    ...OPT_IN_ACTION_TOOL_DEFINITIONS,
    ...linear_tool_definitions_1.LINEAR_ACTION_TOOL_DEFINITIONS,
];
const _assertContextQueryDefinitionsAreExhaustive = true;
const _assertActionDefinitionsAreExhaustive = true;
void _assertContextQueryDefinitionsAreExhaustive;
void _assertActionDefinitionsAreExhaustive;
const contextDefinitionsByName = toDefinitionMap(ALL_CONTEXT_QUERY_TOOL_DEFINITIONS);
const actionDefinitionsByName = toDefinitionMap(ALL_ACTION_TOOL_DEFINITIONS);
function resolveIntegrationContextQueryDefinitions(queries) {
    return queries.map((query) => requireDefinition(contextDefinitionsByName, query));
}
function resolveIntegrationActionDefinitions(actions) {
    return actions.map((action) => requireDefinition(actionDefinitionsByName, action));
}
function actionNeedsApproval(approval, action) {
    if (!approval)
        return false;
    if (action === 'do_not_respond')
        return false;
    if (approval.mode === 'global')
        return true;
    return approval.tools.includes(action);
}
function toDefinitionMap(definitions) {
    const definitionsByName = new Map();
    for (const definition of definitions) {
        if (definitionsByName.has(definition.name)) {
            throw new Error(`Duplicate integration tool operation definition: ${definition.name}`);
        }
        definitionsByName.set(definition.name, definition);
    }
    return definitionsByName;
}
function requireDefinition(definitionsByName, name) {
    const definition = definitionsByName.get(name);
    if (!definition) {
        throw new Error(`Unknown integration tool operation definition: ${name}`);
    }
    return definition;
}
//# sourceMappingURL=integration-tool-definitions.js.map