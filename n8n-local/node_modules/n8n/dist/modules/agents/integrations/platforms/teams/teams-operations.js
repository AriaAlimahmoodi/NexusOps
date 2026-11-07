"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTeamsContextQuery = executeTeamsContextQuery;
const is_record_1 = require("@n8n/utils/is-record");
const zod_1 = require("zod");
const integration_error_codes_1 = require("../../integration-error-codes");
const integration_helpers_1 = require("../../integration-helpers");
const teams_graph_service_1 = require("./teams-graph.service");
const teams_message_files_1 = require("./teams-message-files");
const PLATFORM = 'teams';
const GRAPH_V1 = 'https://graph.microsoft.com/v1.0';
const USER_FIELDS = 'id,displayName,mail,userPrincipalName';
const MAX_TEAMS_SEARCHED = 50;
const CHANNEL_REQUESTS_AT_ONCE = 5;
const PARTIAL_CHANNEL_SEARCH = `Some teams or channels in this organisation were not searched: at most ${MAX_TEAMS_SEARCHED} teams and the first page of channels in each. If the channel is missing, ask someone to mention the bot in it once and use the channelId from get_current_message_context.`;
const getUserSchema = zod_1.z.object({ userId: zod_1.z.string().min(1) });
const searchUsersSchema = zod_1.z.object({
    query: zod_1.z.string().trim().min(1).optional(),
    email: zod_1.z.string().trim().min(1).optional(),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
});
const searchChannelsSchema = zod_1.z.object({
    query: zod_1.z.string().trim().min(1),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
});
const NOT_APPROVED = {
    users: 'A Microsoft administrator has not approved finding people for this app yet. Ask for the Teams user ID of the person instead, or ask an admin to approve the User.ReadBasic.All permission in the Teams channel settings.',
    channels: 'A Microsoft administrator has not approved finding teams and channels for this app yet. Ask someone to mention the bot in the channel once and use the channelId from get_current_message_context, or ask an admin to approve the Team.ReadBasic.All and Channel.ReadBasic.All permissions in the Teams channel settings.',
};
async function executeTeamsContextQuery(params) {
    const { chat, query, input } = params;
    const http = (0, teams_message_files_1.graphHttpOf)(chat.getAdapter(PLATFORM));
    if (!http)
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, query);
    if (query === 'get_user') {
        const { userId } = getUserSchema.parse(input);
        if (userId.startsWith('29:'))
            return { ok: true, user: await chat.getUser(userId) };
        return await withGraphAccess('users', async () => ({
            ok: true,
            user: await getGraphUser(http, userId),
        }));
    }
    if (query === 'search_users') {
        const parsed = searchUsersSchema.parse(input);
        return await withGraphAccess('users', async () => {
            const users = await searchGraphUsers(http, parsed);
            return { ok: true, users, resultCount: users.length };
        });
    }
    if (query === 'search_channels') {
        const parsed = searchChannelsSchema.parse(input);
        return await withGraphAccess('channels', async () => {
            const { channels, partial } = await searchGraphChannels(http, parsed);
            return {
                ok: true,
                channels,
                resultCount: channels.length,
                ...(partial ? { note: PARTIAL_CHANNEL_SEARCH } : {}),
            };
        });
    }
    return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, query);
}
async function withGraphAccess(scope, run) {
    try {
        return await run();
    }
    catch (error) {
        if ((0, teams_message_files_1.statusOf)(error) === 403) {
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.PERMISSION_NOT_GRANTED, NOT_APPROVED[scope]);
        }
        throw error;
    }
}
async function getGraphUser(http, id) {
    try {
        const { data } = await http.get(`${GRAPH_V1}/users/${encodeURIComponent(id)}?$select=${USER_FIELDS}`);
        return toUser(data) ?? null;
    }
    catch (error) {
        if ((0, teams_message_files_1.statusOf)(error) === 404)
            return null;
        throw error;
    }
}
async function searchGraphUsers(http, input) {
    const email = input.email ?? (input.query?.includes('@') ? input.query : undefined);
    if (email) {
        const address = odataString(email);
        return await listUsers(http, `userPrincipalName eq ${address} or mail eq ${address}`, input.limit);
    }
    const term = odataString(input.query ?? '');
    return await listUsers(http, `startswith(displayName,${term}) or startswith(mail,${term}) or startswith(userPrincipalName,${term})`, input.limit);
}
async function listUsers(http, filter, limit) {
    const query = new URLSearchParams({ $filter: filter, $select: USER_FIELDS, $top: String(limit) });
    const { data } = await http.get(`${GRAPH_V1}/users?${query.toString()}`);
    return valuesOf(data)
        .map(toUser)
        .filter((user) => user !== undefined);
}
async function searchGraphChannels(http, input) {
    const query = new URLSearchParams({
        $select: 'id,displayName',
        $top: String(MAX_TEAMS_SEARCHED),
    });
    const { data } = await http.get(`${GRAPH_V1}/teams?${query.toString()}`);
    const teams = valuesOf(data).flatMap((team) => {
        const id = (0, integration_helpers_1.stringProperty)(team, 'id');
        return id ? [{ id, name: (0, integration_helpers_1.stringProperty)(team, 'displayName') ?? id }] : [];
    });
    const words = normalize(input.query).split(' ');
    const matches = [];
    let partial = hasNextPage(data);
    for (let start = 0; start < teams.length && matches.length < input.limit; start += CHANNEL_REQUESTS_AT_ONCE) {
        const batch = teams.slice(start, start + CHANNEL_REQUESTS_AT_ONCE);
        const channelLists = await Promise.all(batch.map(async (team) => {
            const channels = await http
                .get(`${GRAPH_V1}/teams/${encodeURIComponent(team.id)}/channels?$select=id,displayName`)
                .then(({ data: body }) => {
                if (hasNextPage(body))
                    partial = true;
                return valuesOf(body);
            })
                .catch((error) => {
                if ((0, teams_message_files_1.statusOf)(error) === 404)
                    return [];
                throw error;
            });
            return channels.flatMap((channel) => {
                const channelId = (0, integration_helpers_1.stringProperty)(channel, 'id');
                if (!channelId)
                    return [];
                const name = (0, integration_helpers_1.stringProperty)(channel, 'displayName') ?? channelId;
                return [{ channelId, name, teamId: team.id, teamName: team.name }];
            });
        }));
        for (const channel of channelLists.flat()) {
            const haystack = normalize(`${channel.teamName} ${channel.name}`);
            if (words.every((word) => haystack.includes(word)))
                matches.push(channel);
        }
    }
    return {
        channels: matches.slice(0, input.limit),
        partial,
    };
}
function hasNextPage(data) {
    return (0, is_record_1.isRecord)(data) && typeof data['@odata.nextLink'] === 'string';
}
function toUser(value) {
    const userId = (0, integration_helpers_1.stringProperty)(value, 'id');
    if (!userId)
        return undefined;
    const email = (0, integration_helpers_1.stringProperty)(value, 'mail') ?? (0, integration_helpers_1.stringProperty)(value, 'userPrincipalName');
    return {
        userId,
        fullName: (0, integration_helpers_1.stringProperty)(value, 'displayName') ?? email ?? userId,
        email,
        userName: (0, integration_helpers_1.stringProperty)(value, 'userPrincipalName'),
        isBot: false,
    };
}
function valuesOf(data) {
    return (0, is_record_1.isRecord)(data) && Array.isArray(data.value) ? data.value : [];
}
function odataString(value) {
    return `'${(0, teams_graph_service_1.odataLiteral)(value)}'`;
}
function normalize(value) {
    return value.toLowerCase().replace(/^#/, '').replace(/\s+/g, ' ').trim();
}
//# sourceMappingURL=teams-operations.js.map