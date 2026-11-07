"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAT_HUB_RETRIEVE_METADATA_KEYS = void 0;
exports.filterChatHubMetadata = filterChatHubMetadata;
exports.filterChatHubInsertDocuments = filterChatHubInsertDocuments;
const CHAT_HUB_INSERT_METADATA_KEYS = new Set(['loc', 'fileName', 'agentId', 'fileKnowledgeId']);
exports.CHAT_HUB_RETRIEVE_METADATA_KEYS = new Set(['loc', 'fileName']);
function filterChatHubMetadata(metadata, allowedKeys) {
    return Object.fromEntries(Object.entries(metadata).filter(([key]) => allowedKeys.has(key) || key.startsWith('loc.')));
}
function filterChatHubInsertDocuments(documents) {
    return documents.map((doc) => ({
        ...doc,
        metadata: filterChatHubMetadata(doc.metadata, CHAT_HUB_INSERT_METADATA_KEYS),
    }));
}
//# sourceMappingURL=chatHub.js.map