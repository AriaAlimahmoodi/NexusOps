"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKILL_TOOLS = exports.AGENT_TOOLS = exports.INSTANCE_CONTEXT_TOOLS = exports.ACTIVITY_LOG_TOOLS = exports.COMMUNITY_PACKAGE_TOOLS = exports.BUILDER_TOOLS = exports.FOLDER_FEATURE_TOOLS = exports.TOOLS_BY_SCOPE = void 0;
exports.getAllowedToolNames = getAllowedToolNames;
const api_types_1 = require("@n8n/api-types");
const mcp_constants_1 = require("./mcp.constants");
exports.TOOLS_BY_SCOPE = {
    'workflow:read': [
        'search_workflows',
        'get_workflow_details',
        'get_workflow_history',
        'get_workflow_version',
        'get_workflow_versions_diff',
        'search_nodes',
        'get_node_types',
        'get_workflow_best_practices',
        'get_workflow_sdk_reference',
        'validate_workflow',
        'validate_node_config',
        'get_instance_context',
        'get_instance_activity',
        'expand_instance_activity',
        'get_node_usage',
    ],
    'workflow:write': [
        'create_workflow_from_code',
        'update_workflow',
        'archive_workflow',
        'restore_workflow_version',
        'publish_workflow',
        'unpublish_workflow',
        'move_workflows_to_folder',
        'search_nodes',
        'get_node_types',
        'get_workflow_best_practices',
        'get_workflow_sdk_reference',
        'validate_workflow',
        'validate_node_config',
    ],
    'workflow:execute': ['execute_workflow', 'test_workflow', 'prepare_workflow_pin_data'],
    'execution:read': ['get_workflow_execution', 'search_workflow_executions'],
    'agent:read': [
        'search_agents',
        'get_agent',
        'list_agent_versions',
        'discover_agent_assets',
        'validate_agent',
        'get_agent_builder_reference',
    ],
    'agent:write': [
        'create_agent',
        'mutate_agent',
        'revert_agent',
        'delete_agent',
        'verify_agent_mcp_server',
        'search_agents',
        'get_agent',
        'list_agent_versions',
        'discover_agent_assets',
        'validate_agent',
        'get_agent_builder_reference',
        'update_agent_integration',
        'publish_agent',
        'unpublish_agent',
    ],
    'agent:execute': ['call_agent'],
    'skill:read': ['search_skills', 'get_skill'],
    'skill:write': ['create_skill', 'update_skill', 'delete_skill', 'search_skills', 'get_skill'],
    'credential:read': ['list_credentials', 'list_n8n_gateway_services', 'explore_node_resources'],
    'dataTable:read': ['search_data_tables', 'get_data_table_rows'],
    'dataTable:write': [
        'search_data_tables',
        'create_data_table',
        'rename_data_table',
        'add_data_table_column',
        'delete_data_table_column',
        'rename_data_table_column',
        'add_data_table_rows',
    ],
    'project:read': ['search_projects', 'search_folders'],
    'project:write': ['create_folder', 'update_folder', 'search_projects', 'search_folders'],
    'tag:read': ['list_workflow_tags'],
    'communityPackage:install': ['install_community_node'],
    'aiPreference:read': [mcp_constants_1.MCP_GET_USER_PREFERENCES_TOOL_NAME],
    'aiPreference:write': [
        mcp_constants_1.MCP_SAVE_USER_PREFERENCE_TOOL_NAME,
        mcp_constants_1.MCP_UPDATE_USER_PREFERENCE_TOOL_NAME,
        mcp_constants_1.MCP_UNDO_USER_PREFERENCE_TOOL_NAME,
    ],
};
exports.FOLDER_FEATURE_TOOLS = new Set([
    'search_folders',
    'create_folder',
    'update_folder',
    'move_workflows_to_folder',
]);
exports.BUILDER_TOOLS = new Set([
    'search_nodes',
    'get_node_types',
    'get_workflow_best_practices',
    'get_workflow_sdk_reference',
    'validate_workflow',
    'validate_node_config',
    'create_workflow_from_code',
    'update_workflow',
    'archive_workflow',
    'restore_workflow_version',
    'explore_node_resources',
    'search_projects',
    'search_folders',
    'install_community_node',
    ...exports.FOLDER_FEATURE_TOOLS,
]);
exports.COMMUNITY_PACKAGE_TOOLS = new Set(['install_community_node']);
exports.ACTIVITY_LOG_TOOLS = new Set([
    'get_instance_context',
    'get_instance_activity',
    'expand_instance_activity',
]);
exports.INSTANCE_CONTEXT_TOOLS = new Set([
    'get_instance_context',
    'get_instance_activity',
    'expand_instance_activity',
    'get_node_usage',
]);
exports.AGENT_TOOLS = new Set([
    ...exports.TOOLS_BY_SCOPE['agent:read'],
    ...exports.TOOLS_BY_SCOPE['agent:write'],
    ...exports.TOOLS_BY_SCOPE['agent:execute'],
]);
exports.SKILL_TOOLS = new Set([
    ...exports.TOOLS_BY_SCOPE['skill:read'],
    ...exports.TOOLS_BY_SCOPE['skill:write'],
]);
function isMcpScope(scope) {
    return api_types_1.MCP_INSTANCE_SCOPES.includes(scope);
}
function getAllowedToolNames(grantedScopes) {
    if (grantedScopes === undefined)
        return undefined;
    const allowed = new Set();
    for (const scope of grantedScopes) {
        if (!isMcpScope(scope))
            continue;
        for (const toolName of exports.TOOLS_BY_SCOPE[scope]) {
            allowed.add(toolName);
        }
    }
    return allowed;
}
//# sourceMappingURL=mcp-scopes.js.map