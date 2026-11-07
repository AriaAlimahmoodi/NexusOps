"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASK_USER_TOOL_NAMES = exports.LEGACY_ASK_USER_TOOL_NAMES = exports.ASK_USER_TOOL_NAME = exports.TOOL_CALL_PART_TYPES = exports.INVALID_TOOL_CALL_PART_TYPE = exports.TOOL_CALL_PART_TYPE = void 0;
const api_types_1 = require("@n8n/api-types");
exports.TOOL_CALL_PART_TYPE = 'tool-call';
exports.INVALID_TOOL_CALL_PART_TYPE = 'invalid-tool-call';
exports.TOOL_CALL_PART_TYPES = [
    exports.TOOL_CALL_PART_TYPE,
    exports.INVALID_TOOL_CALL_PART_TYPE,
];
exports.ASK_USER_TOOL_NAME = api_types_1.WORKFLOW_BUILDER_TOOL_NAMES.ASK_USER;
exports.LEGACY_ASK_USER_TOOL_NAMES = (0, api_types_1.getLegacyBuilderToolNames)(exports.ASK_USER_TOOL_NAME);
exports.ASK_USER_TOOL_NAMES = [
    exports.ASK_USER_TOOL_NAME,
    ...exports.LEGACY_ASK_USER_TOOL_NAMES,
];
//# sourceMappingURL=conversation-history-content.js.map