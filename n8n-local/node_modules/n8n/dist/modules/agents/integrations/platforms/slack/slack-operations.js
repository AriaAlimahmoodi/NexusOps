"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSlackContextQuery = executeSlackContextQuery;
exports.subscribeSlackThread = subscribeSlackThread;
const zod_1 = require("zod");
const is_record_1 = require("@n8n/utils/is-record");
const integration_helpers_1 = require("../../integration-helpers");
const PLATFORM = 'slack';
const getUserSchema = zod_1.z.object({ userId: zod_1.z.string().min(1) });
const getChannelInfoSchema = zod_1.z.object({ channelId: zod_1.z.string().min(1) });
const searchUsersSchema = zod_1.z
    .object({
    query: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().min(1).optional(),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
    cursor: zod_1.z.string().min(1).optional(),
    includeBots: zod_1.z.boolean().default(false),
    includeDeleted: zod_1.z.boolean().default(false),
})
    .refine((input) => input.query !== undefined || input.email !== undefined, {
    message: 'Provide query or email.',
});
const searchChannelsSchema = zod_1.z.object({
    query: zod_1.z.string().min(1),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
    cursor: zod_1.z.string().min(1).optional(),
    includeArchived: zod_1.z.boolean().default(false),
});
async function executeSlackContextQuery(params) {
    if (params.query === 'get_user') {
        const input = getUserSchema.parse(params.input);
        const user = await params.chat.getUser(input.userId);
        return { ok: true, user };
    }
    if (params.query === 'get_channel_info') {
        const input = getChannelInfoSchema.parse(params.input);
        const channel = params.chat.channel(normalizeChannelId(input.channelId));
        const channelInfo = await channel.fetchMetadata();
        return { ok: true, channel: channelInfo };
    }
    if (params.query === 'search_users') {
        return await searchSlackUsers(params.chat, searchUsersSchema.parse(params.input));
    }
    if (params.query === 'search_channels') {
        return await searchSlackChannels(params.chat, searchChannelsSchema.parse(params.input));
    }
    return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, params.query);
}
async function searchSlackUsers(chat, input) {
    const adapter = getSlackAdapter(chat);
    const usersApi = adapter?.client?.users;
    if (!adapter || !usersApi?.list) {
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'search_users');
    }
    const usersById = new Map();
    const searchTerm = normalizeSearchTerm(input.query ?? input.email ?? '');
    const email = input.email?.trim();
    if (!input.cursor && email && usersApi.lookupByEmail) {
        try {
            const response = await usersApi.lookupByEmail(await withSlackToken(adapter, { email }));
            const user = normalizeSlackUser(response.user);
            if (user &&
                shouldIncludeUser(response.user, input) &&
                matchesUserSearch(response.user, searchTerm, email)) {
                usersById.set(user.userId, user);
            }
        }
        catch {
        }
    }
    let cursor = input.cursor;
    while (usersById.size < input.limit) {
        const remainingLimit = input.limit - usersById.size;
        const response = await usersApi.list(await withSlackToken(adapter, {
            limit: remainingLimit,
            ...(cursor ? { cursor } : {}),
        }));
        for (const rawUser of response.members ?? []) {
            if (!shouldIncludeUser(rawUser, input) || !matchesUserSearch(rawUser, searchTerm, email)) {
                continue;
            }
            const user = normalizeSlackUser(rawUser);
            if (user)
                usersById.set(user.userId, user);
        }
        cursor = response.response_metadata?.next_cursor || undefined;
        if (!cursor)
            break;
    }
    const users = [...usersById.values()].slice(0, input.limit);
    return {
        ok: true,
        users,
        resultCount: users.length,
        ...(cursor ? { nextCursor: cursor } : {}),
    };
}
async function searchSlackChannels(chat, input) {
    const adapter = getSlackAdapter(chat);
    const conversationsApi = adapter?.client?.conversations;
    if (!adapter || !conversationsApi?.list) {
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'search_channels');
    }
    const channelsById = new Map();
    const searchTerm = normalizeChannelSearchTerm(input.query);
    let cursor = input.cursor;
    while (channelsById.size < input.limit) {
        const remainingLimit = input.limit - channelsById.size;
        const response = await conversationsApi.list(await withSlackToken(adapter, {
            exclude_archived: !input.includeArchived,
            limit: remainingLimit,
            types: 'public_channel,private_channel',
            ...(cursor ? { cursor } : {}),
        }));
        for (const rawChannel of response.channels ?? []) {
            if (!input.includeArchived && rawChannel.is_archived === true)
                continue;
            if (!matchesChannelSearch(rawChannel, searchTerm))
                continue;
            const channel = normalizeSlackChannel(rawChannel);
            if (channel)
                channelsById.set(channel.channelId, channel);
        }
        cursor = response.response_metadata?.next_cursor || undefined;
        if (!cursor)
            break;
    }
    const channels = [...channelsById.values()].slice(0, input.limit);
    return {
        ok: true,
        channels,
        resultCount: channels.length,
        ...(cursor ? { nextCursor: cursor } : {}),
    };
}
async function subscribeSlackThread(thread) {
    await thread.subscribe?.();
}
function getSlackAdapter(chat) {
    const adapter = chat.getAdapter('slack');
    if (!(0, is_record_1.isRecord)(adapter))
        return undefined;
    const candidate = adapter;
    if (candidate.client !== undefined && !(0, is_record_1.isRecord)(candidate.client))
        return undefined;
    if (candidate.withToken !== undefined && typeof candidate.withToken !== 'function') {
        return undefined;
    }
    return adapter;
}
async function withSlackToken(adapter, options) {
    if (!adapter.withToken)
        return options;
    return await adapter.withToken(options);
}
function normalizeChannelId(id) {
    return id.includes(':') ? id : `slack:${id}`;
}
function normalizeSlackUser(user) {
    const userId = (0, integration_helpers_1.stringValue)(user?.id);
    if (!userId)
        return undefined;
    const profile = user?.profile;
    const userName = (0, integration_helpers_1.stringValue)(user?.name) ?? userId;
    const fullName = (0, integration_helpers_1.stringValue)(user?.real_name) ??
        (0, integration_helpers_1.stringValue)(profile?.real_name) ??
        (0, integration_helpers_1.stringValue)(profile?.display_name) ??
        userName;
    const email = (0, integration_helpers_1.stringValue)(profile?.email);
    const avatarUrl = (0, integration_helpers_1.stringValue)(profile?.image_192);
    return {
        userId,
        userName,
        fullName,
        ...(email ? { email } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        isBot: user?.is_bot === true,
    };
}
function normalizeSlackChannel(channel) {
    if (!channel)
        return undefined;
    const channelId = (0, integration_helpers_1.stringValue)(channel.id);
    const name = (0, integration_helpers_1.stringValue)(channel.name);
    if (!channelId || !name)
        return undefined;
    return {
        channelId,
        name: `#${name}`,
        isArchived: channel.is_archived === true,
        isMember: channel.is_member === true,
        isPrivate: channel.is_private === true,
        ...(typeof channel.num_members === 'number' ? { memberCount: channel.num_members } : {}),
    };
}
function shouldIncludeUser(user, input) {
    if (!input.includeDeleted && user?.deleted === true)
        return false;
    if (!input.includeBots && user?.is_bot === true)
        return false;
    return true;
}
function matchesUserSearch(user, searchTerm, email) {
    const fields = [
        (0, integration_helpers_1.stringValue)(user?.id),
        (0, integration_helpers_1.stringValue)(user?.name),
        (0, integration_helpers_1.stringValue)(user?.real_name),
        (0, integration_helpers_1.stringValue)(user?.profile?.display_name),
        (0, integration_helpers_1.stringValue)(user?.profile?.real_name),
        (0, integration_helpers_1.stringValue)(user?.profile?.email),
    ]
        .filter((field) => field !== undefined)
        .map(normalizeSearchTerm);
    if (email) {
        const normalizedEmail = normalizeSearchTerm(email);
        if (fields.some((field) => field === normalizedEmail))
            return true;
    }
    return fields.some((field) => field.includes(searchTerm));
}
function matchesChannelSearch(channel, searchTerm) {
    const fields = [(0, integration_helpers_1.stringValue)(channel?.id), (0, integration_helpers_1.stringValue)(channel?.name)]
        .filter((field) => field !== undefined)
        .map(normalizeChannelSearchTerm);
    return fields.some((field) => field.includes(searchTerm));
}
function normalizeSearchTerm(value) {
    return value.trim().toLowerCase().replace(/^[#@]/, '');
}
function normalizeChannelSearchTerm(value) {
    return normalizeSearchTerm(value);
}
//# sourceMappingURL=slack-operations.js.map