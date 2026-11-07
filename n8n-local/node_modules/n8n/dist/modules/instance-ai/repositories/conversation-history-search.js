"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VISIBLE_ROW_MARKERS = exports.ASK_USER_CONTENT_MARKERS = void 0;
exports.buildSearchLikePattern = buildSearchLikePattern;
exports.buildVisibleRowCondition = buildVisibleRowCondition;
exports.buildMessageMatchCondition = buildMessageMatchCondition;
const db_1 = require("@n8n/db");
const conversation_history_content_1 = require("../conversation-history-content");
const toAskUserMarker = (toolName) => `%"toolName":"${toolName}"%`;
exports.ASK_USER_CONTENT_MARKERS = {
    askUserMarker: toAskUserMarker(conversation_history_content_1.ASK_USER_TOOL_NAME),
    legacyAskUserMarker: toAskUserMarker(conversation_history_content_1.LEGACY_ASK_USER_TOOL_NAMES[0] ?? conversation_history_content_1.ASK_USER_TOOL_NAME),
};
const askUserCondition = (alias) => `(${alias}.content LIKE :askUserMarker OR ${alias}.content LIKE :legacyAskUserMarker)`;
function buildSearchLikePattern(query) {
    return `%${(0, db_1.escapeLike)(query.toLowerCase())}%`;
}
function buildVisibleRowCondition(alias) {
    return (`(${alias}.role = 'user'` +
        ` OR (${alias}.content NOT LIKE :toolCallMarker AND ${alias}.content NOT LIKE :invalidToolCallMarker)` +
        ` OR ${askUserCondition(alias)})`);
}
exports.VISIBLE_ROW_MARKERS = {
    ...exports.ASK_USER_CONTENT_MARKERS,
    toolCallMarker: `%"type":"${conversation_history_content_1.TOOL_CALL_PART_TYPE}"%`,
    invalidToolCallMarker: `%"type":"${conversation_history_content_1.INVALID_TOOL_CALL_PART_TYPE}"%`,
};
function buildMessageMatchCondition(alias) {
    return (`((${alias}.role = 'user' AND LOWER(${alias}.content) LIKE :pattern ${db_1.LIKE_ESCAPE_CLAUSE})` +
        ` OR (${alias}.role = 'assistant' AND ${askUserCondition(alias)}` +
        ` AND LOWER(${alias}.content) LIKE :pattern ${db_1.LIKE_ESCAPE_CLAUSE}))`);
}
//# sourceMappingURL=conversation-history-search.js.map