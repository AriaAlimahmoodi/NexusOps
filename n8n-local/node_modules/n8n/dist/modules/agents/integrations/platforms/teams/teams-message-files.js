"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphHttpOf = graphHttpOf;
exports.graphMessagePaths = graphMessagePaths;
exports.statusOf = statusOf;
exports.fetchTeamsMessageFiles = fetchTeamsMessageFiles;
const api_types_1 = require("@n8n/api-types");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const agent_chat_integration_1 = require("../../agent-chat-integration");
const integration_helpers_1 = require("../../integration-helpers");
const GRAPH_ORIGIN = 'https://graph.microsoft.com';
const GRAPH_V1 = `${GRAPH_ORIGIN}/v1.0`;
function graphHttpOf(adapter) {
    if (!(0, is_record_1.isRecord)(adapter) || !(0, is_record_1.isRecord)(adapter.app) || !(0, is_record_1.isRecord)(adapter.app.graph))
        return;
    const http = adapter.app.graph.http;
    return isGraphHttp(http) ? http : undefined;
}
function isGraphHttp(value) {
    return (0, is_record_1.isRecord)(value) && typeof value.get === 'function';
}
function toBuffer(data) {
    if (Buffer.isBuffer(data))
        return data;
    if (data instanceof ArrayBuffer)
        return Buffer.from(data);
    throw new n8n_workflow_1.OperationalError('Microsoft Graph returned no file content');
}
function isHostedOn(messagePath, src) {
    try {
        const url = new URL(src);
        const path = decodeURIComponent(url.pathname);
        const hosted = decodeURIComponent(`/v1.0${messagePath}/hostedContents/`);
        return url.origin === GRAPH_ORIGIN && path.startsWith(hosted) && !path.includes('/..');
    }
    catch {
        return false;
    }
}
function graphMessagePaths(activity) {
    if (!(0, is_record_1.isRecord)(activity) || !(0, is_record_1.isRecord)(activity.conversation))
        return;
    const messageId = (0, integration_helpers_1.stringProperty)(activity, 'id');
    const conversationId = (0, integration_helpers_1.stringProperty)(activity.conversation, 'id');
    if (!messageId || !conversationId)
        return;
    const enc = encodeURIComponent;
    const type = activity.conversation.conversationType;
    if (type === 'groupChat') {
        return { message: `/chats/${enc(conversationId)}/messages/${enc(messageId)}` };
    }
    if (type !== 'channel' || !(0, is_record_1.isRecord)(activity.channelData))
        return;
    const teamId = (0, integration_helpers_1.stringProperty)(activity.channelData.team, 'aadGroupId');
    const channelId = (0, integration_helpers_1.stringProperty)(activity.channelData.channel, 'id');
    if (!teamId || !channelId)
        return;
    const rootId = /;messageid=([^;]+)/.exec(conversationId)?.[1] ?? messageId;
    const channel = `/teams/${enc(teamId)}/channels/${enc(channelId)}`;
    const root = `${channel}/messages/${enc(rootId)}`;
    return {
        message: rootId === messageId ? root : `${root}/replies/${enc(messageId)}`,
        filesFolder: `${channel}/filesFolder`,
    };
}
function statusOf(error) {
    return (0, is_record_1.isRecord)(error) && (0, is_record_1.isRecord)(error.response) ? error.response.status : undefined;
}
function shareIdOf(url) {
    return `u!${Buffer.from(url, 'utf8').toString('base64url')}`;
}
const FILE_ACCESS_DENIED = 'a Microsoft administrator has not allowed file access for this app yet. Ask them to grant admin consent for its Files.Read.All application permission in Microsoft Entra. After approval, it can take up to an hour to apply';
const MESSAGE_ACCESS_DENIED = "Microsoft Teams has not let this app read messages here yet. Update the app in Teams with the latest package from the agent's Teams settings";
const FOREIGN_FILE = "the file is not in this channel's files and the sender does not own it, so the agent does not read it";
function decodedPath(path) {
    try {
        return decodeURIComponent(path);
    }
    catch {
        return path;
    }
}
function locationOf(item) {
    if (!(0, is_record_1.isRecord)(item))
        return;
    const driveId = (0, integration_helpers_1.stringProperty)(item.parentReference, 'driveId');
    const path = (0, integration_helpers_1.stringProperty)(item.parentReference, 'path');
    return driveId && path ? { driveId, path: decodedPath(path) } : undefined;
}
function isInside(item, folder) {
    if (!item || !folder || item.driveId !== folder.driveId)
        return false;
    return item.path === folder.path || item.path.startsWith(`${folder.path}/`);
}
async function getOrExplain(http, url, accessDenied, config) {
    try {
        return (await http.get(url, config)).data;
    }
    catch (error) {
        if (statusOf(error) === 403)
            throw new agent_chat_integration_1.InboundAttachmentAccessError(accessDenied);
        throw error;
    }
}
const DOWNLOAD = {
    responseType: 'arraybuffer',
    maxContentLength: api_types_1.MAX_AGENT_CHAT_ATTACHMENT_SIZE_BYTES,
};
async function downloadSharedFile(http, contentUrl, channelFolder, senderId) {
    const [item, folder] = await Promise.all([
        getOrExplain(http, `${GRAPH_V1}/shares/${shareIdOf(contentUrl)}/driveItem?$select=id,parentReference`, FILE_ACCESS_DENIED),
        channelFolder(),
    ]);
    const itemId = (0, integration_helpers_1.stringProperty)(item, 'id');
    const driveId = (0, is_record_1.isRecord)(item) ? (0, integration_helpers_1.stringProperty)(item.parentReference, 'driveId') : undefined;
    if (!itemId || !driveId)
        throw new n8n_workflow_1.OperationalError('Microsoft Graph did not say where the file is');
    const ownedBySender = async () => {
        if (!senderId)
            return false;
        const drive = await getOrExplain(http, `${GRAPH_V1}/drives/${encodeURIComponent(driveId)}?$select=owner`, FILE_ACCESS_DENIED);
        return ((0, is_record_1.isRecord)(drive) &&
            (0, is_record_1.isRecord)(drive.owner) &&
            (0, integration_helpers_1.stringProperty)(drive.owner.user, 'id') === senderId);
    };
    if (!isInside(locationOf(item), folder) && !(await ownedBySender())) {
        throw new agent_chat_integration_1.InboundAttachmentAccessError(FOREIGN_FILE);
    }
    const content = `${GRAPH_V1}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/content`;
    return toBuffer(await getOrExplain(http, content, FILE_ACCESS_DENIED, DOWNLOAD));
}
async function fetchTeamsMessageFiles(http, activity) {
    const paths = graphMessagePaths(activity);
    if (!paths)
        return [];
    const message = await getOrExplain(http, `${GRAPH_V1}${paths.message}`, MESSAGE_ACCESS_DENIED);
    if (!(0, is_record_1.isRecord)(message))
        return [];
    const senderId = (0, is_record_1.isRecord)(message.from) ? (0, integration_helpers_1.stringProperty)(message.from.user, 'id') : undefined;
    let folder;
    const channelFolder = async () => await (folder ??= paths.filesFolder
        ? getOrExplain(http, `${GRAPH_V1}${paths.filesFolder}?$select=name,parentReference`, FILE_ACCESS_DENIED).then((found) => {
            const parent = locationOf(found);
            const name = (0, integration_helpers_1.stringProperty)(found, 'name');
            return parent && name ? { ...parent, path: `${parent.path}/${name}` } : undefined;
        })
        : Promise.resolve(undefined));
    const files = [];
    for (const attachment of Array.isArray(message.attachments) ? message.attachments : []) {
        const contentUrl = (0, integration_helpers_1.stringProperty)(attachment, 'contentUrl');
        if ((0, integration_helpers_1.stringProperty)(attachment, 'contentType') !== 'reference' || !contentUrl)
            continue;
        files.push({
            type: 'file',
            name: (0, integration_helpers_1.stringProperty)(attachment, 'name'),
            url: contentUrl,
            fetchData: async () => await downloadSharedFile(http, contentUrl, channelFolder, senderId),
        });
    }
    const body = (0, integration_helpers_1.stringProperty)(message.body, 'content') ?? '';
    for (const [, src] of body.matchAll(/<img[^>]+src="([^"]+)"/g)) {
        if (!isHostedOn(paths.message, src))
            continue;
        files.push({
            type: 'image',
            name: 'image',
            url: src,
            fetchData: async () => toBuffer(await getOrExplain(http, src, MESSAGE_ACCESS_DENIED, DOWNLOAD)),
        });
    }
    return files;
}
//# sourceMappingURL=teams-message-files.js.map