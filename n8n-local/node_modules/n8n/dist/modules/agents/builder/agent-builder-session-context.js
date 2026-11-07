"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBuilderSessionContext = buildBuilderSessionContext;
const agent_builder_preview_path_1 = require("./agent-builder-preview-path");
const agents_builder_model_recommendations_1 = require("./agents-builder-model-recommendations");
const NO_MODEL_RECOMMENDATIONS = 'No Recommended LLM models section is available; do not recommend or name current, best, latest, or fallback model IDs from memory. Ask via `agent_builder_ask_questions` when the user needs model guidance or choice.';
async function buildBuilderSessionContext(projectId, agentId) {
    const modelRecommendationsSection = await (0, agents_builder_model_recommendations_1.getModelRecommendationsSection)();
    return `\
## Session context

- Preview link for the target agent: [Preview](${(0, agent_builder_preview_path_1.buildAgentPreviewPath)(projectId, agentId)})

${modelRecommendationsSection ?? NO_MODEL_RECOMMENDATIONS}`;
}
//# sourceMappingURL=agent-builder-session-context.js.map