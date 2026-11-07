export declare const BUILDER_TOOLS: {
    readonly WRITE_CONFIG: "agent_builder_write_config";
    readonly PATCH_CONFIG: "agent_builder_patch_config";
    readonly BUILD_CUSTOM_TOOL: "agent_builder_build_custom_tool";
    readonly CREATE_SKILLS: "agent_builder_create_skills";
    readonly UPDATE_SKILL: "agent_builder_update_skill";
    readonly CREATE_TASKS: "agent_builder_create_tasks";
    readonly UPDATE_TASK: "agent_builder_update_task";
    readonly FINISH_SETUP: "agent_builder_finish_setup";
    readonly GET_RESOURCE_LOCATOR_OPTIONS: "agent_builder_get_resource_locator_options";
    readonly CALL_AGENT: "agent_builder_call_agent";
    readonly PUBLISH_AGENT: "agent_builder_publish_agent";
    readonly UNPUBLISH_AGENT: "agent_builder_unpublish_agent";
    readonly RESOLVE_LLM: "agent_builder_resolve_llm";
    readonly VERIFY_MCP_SERVER: "agent_builder_verify_mcp_server";
    readonly SEARCH_NODES: "agent_builder_search_nodes";
    readonly GET_NODE_TYPES: "agent_builder_get_node_types";
    readonly LIST_CREDENTIALS: "agent_builder_list_credentials";
};
export type BuilderToolName = (typeof BUILDER_TOOLS)[keyof typeof BUILDER_TOOLS];
export declare const AGENT_THREAD_PREFIX: {
    readonly TEST: 'test-';
};
