"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_DOCUMENTATION_TOOL = exports.DocumentationType = void 0;
exports.createGetDocumentationTool = createGetDocumentationTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const builder_1 = require("../prompts/builder");
const node_recommendations_1 = require("../prompts/shared/node-recommendations");
const best_practices_1 = require("../tools/best-practices");
const progress_1 = require("../tools/helpers/progress");
const response_1 = require("../tools/helpers/response");
const categorization_1 = require("../types/categorization");
const node_recommendations_2 = require("../types/node-recommendations");
exports.DocumentationType = {
    BEST_PRACTICES: 'best_practices',
    NODE_RECOMMENDATIONS: 'node_recommendations',
};
const bestPracticesRequestSchema = zod_1.z.object({
    type: zod_1.z.literal(exports.DocumentationType.BEST_PRACTICES),
    techniques: zod_1.z
        .array(zod_1.z.nativeEnum(categorization_1.WorkflowTechnique))
        .min(1)
        .describe('Workflow techniques to get best practices for'),
});
const nodeRecommendationsRequestSchema = zod_1.z.object({
    type: zod_1.z.literal(exports.DocumentationType.NODE_RECOMMENDATIONS),
    categories: zod_1.z
        .array(zod_1.z.nativeEnum(node_recommendations_2.RecommendationCategory))
        .min(1)
        .describe('Task categories to get node recommendations for'),
});
const getDocumentationSchema = zod_1.z.object({
    requests: zod_1.z
        .array(zod_1.z.union([bestPracticesRequestSchema, nodeRecommendationsRequestSchema]))
        .min(1)
        .describe('Array of documentation requests to retrieve'),
});
function formatBestPractices(techniques) {
    const foundDocs = [];
    for (const technique of techniques) {
        const doc = best_practices_1.documentation[technique];
        if (doc) {
            foundDocs.push(doc.getDocumentation());
        }
    }
    if (foundDocs.length === 0) {
        return '';
    }
    return (0, builder_1.prompt)().section('best_practices', foundDocs.join('\n---\n')).build();
}
function formatCategory(category, content) {
    return (0, builder_1.prompt)().section(category, content).build();
}
function formatNodeRecommendations(categories) {
    const foundRecs = [];
    for (const category of categories) {
        const rec = node_recommendations_1.recommendations[category];
        if (rec) {
            foundRecs.push(formatCategory(category, (0, node_recommendations_1.formatRecommendation)(rec.recommendation)));
        }
    }
    if (foundRecs.length === 0) {
        return '';
    }
    return (0, builder_1.prompt)().section('node_recommendations', foundRecs.join('\n')).build();
}
exports.GET_DOCUMENTATION_TOOL = {
    toolName: 'get_documentation',
    displayTitle: 'Getting documentation',
};
function createGetDocumentationTool() {
    const dynamicTool = (0, tools_1.tool)((input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.GET_DOCUMENTATION_TOOL.toolName, exports.GET_DOCUMENTATION_TOOL.displayTitle);
        try {
            const validatedInput = getDocumentationSchema.parse(input);
            const { requests } = validatedInput;
            reporter.start(validatedInput);
            reporter.progress(`Processing ${requests.length} documentation request(s)...`);
            const results = [];
            let bestPracticesContent;
            const allTechniques = [];
            for (const request of requests) {
                if (request.type === exports.DocumentationType.BEST_PRACTICES) {
                    const { techniques } = request;
                    const availableDocs = techniques.filter((t) => best_practices_1.documentation[t]);
                    if (availableDocs.length > 0) {
                        const content = formatBestPractices(techniques);
                        results.push(content);
                        bestPracticesContent = content;
                        allTechniques.push(...techniques);
                    }
                }
                else {
                    const { categories } = request;
                    const availableRecs = categories.filter((c) => node_recommendations_1.recommendations[c]);
                    if (availableRecs.length > 0) {
                        results.push(formatNodeRecommendations(categories));
                    }
                }
            }
            if (results.length === 0) {
                const message = 'No documentation available for the requested items.';
                reporter.complete({ requests: requests.length, found: 0 });
                return (0, response_1.createSuccessResponse)(config, message);
            }
            const message = results.join('\n\n');
            reporter.complete({ requests: requests.length, found: results.length });
            const stateUpdates = {};
            if (bestPracticesContent) {
                stateUpdates.bestPractices = bestPracticesContent;
                stateUpdates.techniqueCategories = allTechniques;
            }
            return (0, response_1.createSuccessResponse)(config, message, Object.keys(stateUpdates).length > 0 ? stateUpdates : undefined);
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
                toolName: exports.GET_DOCUMENTATION_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.GET_DOCUMENTATION_TOOL.toolName,
        description: `Retrieve documentation to guide workflow building.

TYPE: best_practices
Use when you need guidance on workflow patterns and implementation.
Requires: techniques array (workflow techniques to get practices for)
Returns: Best practices including recommended nodes, common pitfalls, performance tips.

TYPE: node_recommendations
Use when user wants AI capabilities but doesn't specify exact nodes/providers.
Requires: categories array (task categories to get recommendations for)
Returns: Default node recommendations with alternatives.

Do NOT use node_recommendations when:
- User explicitly names a provider (e.g., "use Claude", "with OpenAI", "using Gemini")
- User specifies exact node names

Available techniques for best_practices:
- trigger, loop, branch, subroutine, pagination, parallel_execution, error_handling, scheduling, rate_limiting, batch_processing, ai_agent, ai_chain, rag, data_transformation, http_request

Available categories for node_recommendations:
- text_manipulation: summarization, analysis, extraction, classification, chat
- image_generation: generate, analyze, edit images
- video_generation: create videos from text/images
- audio_generation: text-to-speech, transcription, translation`,
        schema: getDocumentationSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.GET_DOCUMENTATION_TOOL,
    };
}
//# sourceMappingURL=get-documentation.tool.js.map