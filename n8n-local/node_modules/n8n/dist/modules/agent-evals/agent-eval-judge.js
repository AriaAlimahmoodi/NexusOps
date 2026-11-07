"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeAgentAnswer = judgeAgentAnswer;
const errors_1 = require("@n8n/errors");
const model_config_1 = require("../../modules/agents/json-config/model-config");
const agent_credential_provider_1 = require("../../modules/agents/utils/agent-credential-provider");
async function judgeAgentAnswer({ agentConfigService, credentialsService, logger }, { input, output, criteria, expectedOutput }, ctx) {
    if (!criteria && !expectedOutput)
        return { status: 'skipped', outcome: null, reasoning: null };
    try {
        const config = await agentConfigService.getConfig(ctx.agentId, ctx.projectId);
        if (!config.model || !config.credential) {
            throw new errors_1.BadRequestError('This agent has no configured model and credential to judge with.');
        }
        const credentialProvider = (0, agent_credential_provider_1.createAgentCredentialProvider)(credentialsService, ctx.projectId, ctx.user, ctx.agentId);
        const modelConfig = await (0, model_config_1.resolveCredentialAwareModelConfig)(config.model, config.credential, credentialProvider, config.modelDeploymentName);
        const { evals } = await import('@n8n/agents');
        const score = criteria
            ? await evals.criteria().model(modelConfig).run({ input, output, criteria })
            : await evals
                .correctness()
                .model(modelConfig)
                .run({ input, output, expected: expectedOutput ?? undefined });
        return {
            status: 'completed',
            outcome: score.pass ? 'pass' : 'fail',
            reasoning: score.reasoning,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('[AgentEvalJudge] Judging failed', { error: message });
        return { status: 'error', outcome: null, reasoning: message };
    }
}
//# sourceMappingURL=agent-eval-judge.js.map