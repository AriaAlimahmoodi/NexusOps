export declare const USER_CONNECTED_TO_MCP_EVENT = "User connected to MCP server";
export declare const USER_CALLED_MCP_TOOL_EVENT = "User called mcp tool";
export declare const MCP_PREVIEW_RENDER_REQUESTED_EVENT = "MCP App preview render requested";
export declare const MCP_CREDENTIALS_AUTOASSIGN_EVENT = "MCP credentials autoassign";
export declare const MCP_PROTOCOL_VERSION_META_KEY = "io.modelcontextprotocol/protocolVersion";
export declare const MCP_CLIENT_INFO_META_KEY = "io.modelcontextprotocol/clientInfo";
export declare const MCP_DISCOVER_METHOD = "server/discover";
export declare const UNAUTHORIZED_ERROR_MESSAGE = "Unauthorized";
export declare const INTERNAL_SERVER_ERROR_MESSAGE = "Internal server error";
export declare const MCP_ACCESS_DISABLED_ERROR_MESSAGE = "MCP access is disabled";
export declare const MCP_INSTANCE_READ_ONLY_ERROR_MESSAGE = "This instance is protected. Use read-only operations or production workflow executions.";
export declare const HANDSHAKE_FAILED_ERROR_MESSAGE = "MCP handshake failed";
export declare const MISSING_PROTOCOL_VERSION_ERROR_MESSAGE = "MCP handshake failed: no protocol version declared";
export declare const LIST_N8N_GATEWAY_SERVICES_TOOL_NAME = "list_n8n_gateway_services";
export declare const MCP_GET_USER_PREFERENCES_TOOL_NAME = "get_user_preferences";
export declare const MCP_SAVE_USER_PREFERENCE_TOOL_NAME = "save_user_preference";
export declare const MCP_UPDATE_USER_PREFERENCE_TOOL_NAME = "update_user_preference";
export declare const MCP_UNDO_USER_PREFERENCE_TOOL_NAME = "undo_user_preference";
export declare const INSTALL_COMMUNITY_NODE_TOOL: {
    readonly toolName: 'install_community_node';
    readonly displayTitle: 'Install Community Node';
};
export declare const MCP_USER_PREFERENCES_TRIGGER_CLAUSE = "you create or modify anything in n8n \u2014 a workflow, an Agent, a data table, a folder \u2014";
export declare const MCP_CALL_AGENT_TOOL_NAME = "call_agent";
export declare const MCP_CREATE_AGENT_TOOL_NAME = "create_agent";
export declare const SUPPORTED_PRODUCTION_MCP_TRIGGERS: {
    "n8n-nodes-base.scheduleTrigger": string;
    "n8n-nodes-base.webhook": string;
    "n8n-nodes-base.formTrigger": string;
    "@n8n/n8n-nodes-langchain.chatTrigger": string;
};
export declare const SUPPORTED_MCP_TRIGGERS: {
    "n8n-nodes-base.scheduleTrigger": string;
    "n8n-nodes-base.webhook": string;
    "n8n-nodes-base.formTrigger": string;
    "@n8n/n8n-nodes-langchain.chatTrigger": string;
    "n8n-nodes-base.manualTrigger": string;
};
