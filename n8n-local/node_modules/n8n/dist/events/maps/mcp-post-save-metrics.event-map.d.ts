export type McpPostSaveTool = 'create' | 'update';
export type McpPostSaveMetricsEventMap = {
    'mcp-post-save-failure': {
        tool: McpPostSaveTool;
        errorType: string;
    };
};
