"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_SEARCH_TOOL = void 0;
exports.createNodeSearchTool = createNodeSearchTool;
const tools_1 = require("@langchain/core/tools");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const node_search_engine_1 = require("./engines/node-search-engine");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const searchQuerySchema = zod_1.z.object({
    queryType: zod_1.z.enum(['name', 'subNodeSearch']).describe('Type of search to perform'),
    query: zod_1.z.string().optional().describe('Search term to filter results'),
    connectionType: zod_1.z
        .nativeEnum(n8n_workflow_1.NodeConnectionTypes)
        .optional()
        .describe('For subNodeSearch: connection type like ai_languageModel, ai_tool, etc.'),
});
const nodeSearchSchema = zod_1.z.object({
    queries: zod_1.z
        .array(searchQuerySchema)
        .min(1)
        .describe('Array of search queries to find different types of nodes'),
});
const SEARCH_LIMIT = 5;
function processQuery(query, searchEngine) {
    if (query.queryType === 'name') {
        const searchTerm = query.query;
        if (!searchTerm) {
            return {
                searchResults: [],
                searchIdentifier: '',
            };
        }
        const searchResults = searchEngine.searchByName(searchTerm, SEARCH_LIMIT);
        return {
            searchResults,
            searchIdentifier: searchTerm,
        };
    }
    else {
        const connectionType = query.connectionType;
        if (!connectionType) {
            return {
                searchResults: [],
                searchIdentifier: '',
            };
        }
        const searchResults = searchEngine.searchByConnectionType(connectionType, SEARCH_LIMIT, query.query);
        const searchIdentifier = query.query
            ? `sub-nodes with ${connectionType} output matching "${query.query}"`
            : `sub-nodes with ${connectionType} output`;
        return {
            searchResults,
            searchIdentifier,
        };
    }
}
function buildResponseMessage(results, nodeTypes) {
    const searchEngine = new node_search_engine_1.NodeSearchEngine(nodeTypes);
    let responseContent = '';
    for (const { query, results: searchResults } of results) {
        if (responseContent)
            responseContent += '\n\n';
        if (searchResults.length === 0) {
            responseContent += `No nodes found matching "${query}"`;
        }
        else {
            responseContent += `Found ${searchResults.length} nodes matching "${query}":${searchResults
                .map((node) => searchEngine.formatResult(node))
                .join('')}`;
        }
    }
    return responseContent;
}
exports.NODE_SEARCH_TOOL = {
    toolName: 'search_nodes',
    displayTitle: 'Searching nodes',
};
function createNodeSearchTool(nodeTypes) {
    const dynamicTool = (0, tools_1.tool)((input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.NODE_SEARCH_TOOL.toolName, exports.NODE_SEARCH_TOOL.displayTitle);
        try {
            const validatedInput = nodeSearchSchema.parse(input);
            const { queries } = validatedInput;
            reporter.start(validatedInput);
            const allResults = [];
            const searchEngine = new node_search_engine_1.NodeSearchEngine(nodeTypes);
            const batchReporter = (0, progress_1.createBatchProgressReporter)(reporter, 'Searching nodes');
            batchReporter.init(queries.length);
            for (const searchQuery of queries) {
                const { searchResults, searchIdentifier } = processQuery(searchQuery, searchEngine);
                batchReporter.next(searchIdentifier);
                allResults.push({
                    query: searchIdentifier,
                    results: searchResults,
                });
            }
            batchReporter.complete();
            const responseMessage = buildResponseMessage(allResults, nodeTypes);
            const output = {
                results: allResults,
                totalResults: allResults.reduce((sum, r) => sum + r.results.length, 0),
                message: responseMessage,
            };
            reporter.complete(output);
            return (0, response_1.createSuccessResponse)(config, responseMessage);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const validationError = new errors_1.ValidationError('Invalid input parameters', {
                    extra: { errors: error.errors },
                });
                reporter.error(validationError);
                return (0, response_1.createErrorResponse)(config, validationError);
            }
            const toolError = new errors_1.ToolExecutionError(error instanceof Error ? error.message : 'Unknown error occurred', {
                toolName: exports.NODE_SEARCH_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.NODE_SEARCH_TOOL.toolName,
        description: `Search for n8n nodes by name or find sub-nodes that output specific connection types. Use this before adding nodes to find the correct node types.

Search modes:
1. Name search (default): Search nodes by name/description
   Example: { queryType: "name", query: "http" }

2. Sub-node search: Find sub-nodes that output specific AI connection types
   Example: { queryType: "subNodeSearch", connectionType: NodeConnectionTypes.AiTool }
   With optional query filter: { queryType: "subNodeSearch", connectionType: NodeConnectionTypes.AiTool, query: "calculator" }
   This finds sub-nodes (like "Calculator Tool") that can be connected to nodes accepting that connection type

Common AI connection types for sub-node search:
- NodeConnectionTypes.AiLanguageModel (finds LLM provider sub-nodes like "OpenAI Chat Model")
- NodeConnectionTypes.AiTool (finds tool sub-nodes like "Calculator Tool", "Code Tool")
- NodeConnectionTypes.AiMemory (finds memory sub-nodes like "Window Buffer Memory")
- NodeConnectionTypes.AiEmbedding (finds embedding sub-nodes like "Embeddings OpenAI")
- NodeConnectionTypes.AiVectorStore (finds vector store sub-nodes)
- NodeConnectionTypes.AiDocument (finds document loader sub-nodes)
- NodeConnectionTypes.AiTextSplitter (finds text splitter sub-nodes)

You can search for multiple different criteria at once by providing an array of queries.`,
        schema: nodeSearchSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.NODE_SEARCH_TOOL,
    };
}
//# sourceMappingURL=node-search.tool.js.map