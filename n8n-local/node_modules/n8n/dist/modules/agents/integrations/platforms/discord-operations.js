"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordSearchChannelsSchema = void 0;
exports.downloadDiscordAttachment = downloadDiscordAttachment;
exports.searchDiscordChannels = searchDiscordChannels;
exports.executeDiscordContextQuery = executeDiscordContextQuery;
exports.resolveDiscordMessageTargetChannelId = resolveDiscordMessageTargetChannelId;
exports.settleDiscordActionMessage = settleDiscordActionMessage;
exports.fetchDiscordApplicationMetadata = fetchDiscordApplicationMetadata;
const zod_1 = require("zod");
const integration_helpers_1 = require("../integration-helpers");
const PLATFORM = 'discord';
const DISCORD_MESSAGE_CONTENT_LIMIT = 2000;
const DISCORD_ATTACHMENT_HOST = 'cdn.discordapp.com';
const POSTABLE_CHANNEL_TYPES = new Set([
    0,
    5,
]);
const MAX_GUILDS_SCANNED = 20;
async function downloadDiscordAttachment(attachmentUrl, httpClient) {
    const url = new URL(attachmentUrl);
    if (url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.hostname !== DISCORD_ATTACHMENT_HOST ||
        !url.pathname.startsWith('/attachments/')) {
        throw new Error('Invalid Discord attachment URL');
    }
    const response = await httpClient.request({
        method: 'GET',
        url: url.href,
        encoding: 'arraybuffer',
        returnFullResponse: true,
        ignoreHttpStatusErrors: true,
        disableFollowRedirect: true,
        timeout: 30_000,
        abortSignal: AbortSignal.timeout(30_000),
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(`Discord attachment download failed with status ${response.statusCode}`);
    }
    return Buffer.from(response.body);
}
exports.discordSearchChannelsSchema = zod_1.z.object({
    query: zod_1.z.string().min(1),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
    cursor: zod_1.z.string().min(1).optional(),
});
async function discordApiGet(httpClient, apiUrl, botToken, path) {
    const response = await httpClient.request({
        method: 'GET',
        url: `${apiUrl}${path}`,
        headers: { Authorization: `Bot ${botToken}` },
        json: true,
        returnFullResponse: true,
        ignoreHttpStatusErrors: true,
        sendCredentialsOnCrossOriginRedirect: false,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(`Discord API ${path} failed: ${response.statusCode} ${JSON.stringify(response.body)}`);
    }
    return response.body;
}
function normalizeChannelName(value) {
    return value.trim().replace(/^#/, '').toLowerCase();
}
async function searchDiscordChannels(params) {
    const { httpClient, apiUrl, botToken, input } = params;
    const searchTerm = normalizeChannelName(input.query);
    const guildParams = new URLSearchParams({ limit: String(MAX_GUILDS_SCANNED) });
    if (input.cursor)
        guildParams.set('after', input.cursor);
    const guilds = await discordApiGet(httpClient, apiUrl, botToken, `/users/@me/guilds?${guildParams.toString()}`);
    const channels = [];
    let lastScannedGuildId;
    for (const guild of guilds) {
        if (channels.length >= input.limit)
            break;
        lastScannedGuildId = guild.id;
        let guildChannels;
        try {
            guildChannels = await discordApiGet(httpClient, apiUrl, botToken, `/guilds/${guild.id}/channels`);
        }
        catch {
            continue;
        }
        for (const channel of guildChannels) {
            if (channels.length >= input.limit)
                break;
            if (!POSTABLE_CHANNEL_TYPES.has(channel.type) || !channel.name)
                continue;
            if (!normalizeChannelName(channel.name).includes(searchTerm))
                continue;
            channels.push({
                channelId: `discord:${guild.id}:${channel.id}`,
                name: channel.name,
                guildId: guild.id,
                guildName: guild.name,
            });
        }
    }
    const hasUnscannedGuilds = lastScannedGuildId !== undefined && lastScannedGuildId !== guilds.at(-1)?.id;
    const nextCursor = lastScannedGuildId && (hasUnscannedGuilds || guilds.length === MAX_GUILDS_SCANNED)
        ? lastScannedGuildId
        : undefined;
    return {
        ok: true,
        channels,
        resultCount: channels.length,
        ...(nextCursor ? { nextCursor } : {}),
    };
}
async function executeDiscordContextQuery(params) {
    if (params.query !== 'search_channels')
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, params.query);
    if (!params.botToken)
        return (0, integration_helpers_1.connectionUnavailable)();
    return await searchDiscordChannels({
        httpClient: params.httpClient,
        apiUrl: params.apiUrl,
        botToken: params.botToken,
        input: exports.discordSearchChannelsSchema.parse(params.input),
    });
}
function resolveDiscordMessageTargetChannelId(threadId) {
    const parts = threadId.split(':');
    if (parts[0] !== 'discord' || parts.length < 3 || !parts[2]) {
        throw new Error(`Invalid Discord thread ID: ${threadId}`);
    }
    return parts[3] || parts[2];
}
async function settleDiscordActionMessage(params) {
    const channelId = resolveDiscordMessageTargetChannelId(params.threadId);
    const content = params.content.slice(0, DISCORD_MESSAGE_CONTENT_LIMIT);
    const response = await params.httpClient.request({
        method: 'PATCH',
        url: `${params.apiUrl}/channels/${channelId}/messages/${params.messageId}`,
        headers: { Authorization: `Bot ${params.botToken}` },
        body: {
            content,
            embeds: [],
            components: [],
            allowed_mentions: { parse: [] },
        },
        json: true,
        returnFullResponse: true,
        ignoreHttpStatusErrors: true,
        sendCredentialsOnCrossOriginRedirect: false,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(`Discord API PATCH /channels/${channelId}/messages/${params.messageId} failed: ${response.statusCode}`);
    }
}
async function fetchDiscordApplicationMetadata(params) {
    const response = await params.httpClient.request({
        method: 'GET',
        url: `${params.apiUrl}/oauth2/applications/@me`,
        headers: { Authorization: `Bot ${params.botToken}` },
        json: true,
        returnFullResponse: true,
        ignoreHttpStatusErrors: true,
        sendCredentialsOnCrossOriginRedirect: false,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
        return { ok: false, kind: 'http', status: response.statusCode };
    }
    const body = response.body;
    if (typeof body.id !== 'string' ||
        !body.id ||
        typeof body.verify_key !== 'string' ||
        !body.verify_key) {
        return { ok: false, kind: 'incomplete' };
    }
    return { ok: true, application: { id: body.id, verify_key: body.verify_key } };
}
//# sourceMappingURL=discord-operations.js.map