"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_MCP_TRIGGERS = exports.SUPPORTED_PRODUCTION_MCP_TRIGGERS = exports.MCP_CREATE_AGENT_TOOL_NAME = exports.MCP_CALL_AGENT_TOOL_NAME = exports.MCP_USER_PREFERENCES_TRIGGER_CLAUSE = exports.INSTALL_COMMUNITY_NODE_TOOL = exports.MCP_UNDO_USER_PREFERENCE_TOOL_NAME = exports.MCP_UPDATE_USER_PREFERENCE_TOOL_NAME = exports.MCP_SAVE_USER_PREFERENCE_TOOL_NAME = exports.MCP_GET_USER_PREFERENCES_TOOL_NAME = exports.LIST_N8N_GATEWAY_SERVICES_TOOL_NAME = exports.MISSING_PROTOCOL_VERSION_ERROR_MESSAGE = exports.HANDSHAKE_FAILED_ERROR_MESSAGE = exports.MCP_INSTANCE_READ_ONLY_ERROR_MESSAGE = exports.MCP_ACCESS_DISABLED_ERROR_MESSAGE = exports.INTERNAL_SERVER_ERROR_MESSAGE = exports.UNAUTHORIZED_ERROR_MESSAGE = exports.MCP_DISCOVER_METHOD = exports.MCP_CLIENT_INFO_META_KEY = exports.MCP_PROTOCOL_VERSION_META_KEY = exports.MCP_CREDENTIALS_AUTOASSIGN_EVENT = exports.MCP_PREVIEW_RENDER_REQUESTED_EVENT = exports.USER_CALLED_MCP_TOOL_EVENT = exports.USER_CONNECTED_TO_MCP_EVENT = void 0;
const n8n_workflow_1 = require("n8n-workflow");
exports.USER_CONNECTED_TO_MCP_EVENT = 'User connected to MCP server';
exports.USER_CALLED_MCP_TOOL_EVENT = 'User called mcp tool';
exports.MCP_PREVIEW_RENDER_REQUESTED_EVENT = 'MCP App preview render requested';
exports.MCP_CREDENTIALS_AUTOASSIGN_EVENT = 'MCP credentials autoassign';
exports.MCP_PROTOCOL_VERSION_META_KEY = 'io.modelcontextprotocol/protocolVersion';
exports.MCP_CLIENT_INFO_META_KEY = 'io.modelcontextprotocol/clientInfo';
exports.MCP_DISCOVER_METHOD = 'server/discover';
exports.UNAUTHORIZED_ERROR_MESSAGE = 'Unauthorized';
exports.INTERNAL_SERVER_ERROR_MESSAGE = 'Internal server error';
exports.MCP_ACCESS_DISABLED_ERROR_MESSAGE = 'MCP access is disabled';
exports.MCP_INSTANCE_READ_ONLY_ERROR_MESSAGE = 'This instance is protected. Use read-only operations or production workflow executions.';
exports.HANDSHAKE_FAILED_ERROR_MESSAGE = 'MCP handshake failed';
exports.MISSING_PROTOCOL_VERSION_ERROR_MESSAGE = 'MCP handshake failed: no protocol version declared';
exports.LIST_N8N_GATEWAY_SERVICES_TOOL_NAME = 'list_n8n_gateway_services';
exports.MCP_GET_USER_PREFERENCES_TOOL_NAME = 'get_user_preferences';
exports.MCP_SAVE_USER_PREFERENCE_TOOL_NAME = 'save_user_preference';
exports.MCP_UPDATE_USER_PREFERENCE_TOOL_NAME = 'update_user_preference';
exports.MCP_UNDO_USER_PREFERENCE_TOOL_NAME = 'undo_user_preference';
exports.INSTALL_COMMUNITY_NODE_TOOL = {
    toolName: 'install_community_node',
    displayTitle: 'Install Community Node',
};
exports.MCP_USER_PREFERENCES_TRIGGER_CLAUSE = 'you create or modify anything in n8n — a workflow, an Agent, a data table, a folder —';
exports.MCP_CALL_AGENT_TOOL_NAME = 'call_agent';
exports.MCP_CREATE_AGENT_TOOL_NAME = 'create_agent';
exports.SUPPORTED_PRODUCTION_MCP_TRIGGERS = {
    [n8n_workflow_1.SCHEDULE_TRIGGER_NODE_TYPE]: 'Schedule Trigger',
    [n8n_workflow_1.WEBHOOK_NODE_TYPE]: 'Webhook Trigger',
    [n8n_workflow_1.FORM_TRIGGER_NODE_TYPE]: 'Form Trigger',
    [n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE]: 'Chat Trigger',
};
exports.SUPPORTED_MCP_TRIGGERS = {
    ...exports.SUPPORTED_PRODUCTION_MCP_TRIGGERS,
    [n8n_workflow_1.MANUAL_TRIGGER_NODE_TYPE]: 'Manual Trigger',
};
//# sourceMappingURL=mcp.constants.js.map