"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvalInsightsService = exports.DETERMINISTIC_MODEL_TAG = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const telemetry_1 = require("../../telemetry");
const metric_scales_1 = require("../metric-scales");
const insights_context_builder_1 = require("./insights-context-builder");
const insights_model_resolver_1 = require("./insights-model-resolver");
const INSIGHTS_SYSTEM_PROMPT = [
    'You are an evaluation analyst for n8n workflow evaluations.',
    'You compare workflow versions run against the same dataset and explain the results.',
    'Given the JSON context, produce:',
    '- `winner`: set `versionLabel` to the base version letter given in the context; explain why it leads.',
    '- `regressions`: versions that scored notably worse than the winner on a specific metric',
    '  (empty array if none). `delta` is the percentage-point difference vs the winner (negative = worse).',
    '- `suggestedNext`: one concrete next experiment, with a testable `hypothesis`.',
    'Ground every statement in the provided metric scores, workflow node diffs, and regressed cases.',
    'Each modified node carries its changed prompt text (before → after) under `promptChanges` — when',
    'such a change explains a regression, quote the specific instruction that changed rather than',
    'guessing (e.g. a system prompt that tells the model to answer a category incorrectly). Cite metric',
    'names and node names. Scores are percentages (0–100).',
    'Keep each headline under 120 characters and each body under 280 characters.',
].join('\n');
exports.DETERMINISTIC_MODEL_TAG = 'deterministic';
const INSIGHTS_GENERATE_TIMEOUT_MS = 60_000;
const MAX_REGRESSIONS = 10;
let EvalInsightsService = class EvalInsightsService {
    constructor(collectionRepo, evalConfigRepo, licenseState, telemetry, logger, modelResolver, contextBuilder) {
        this.collectionRepo = collectionRepo;
        this.evalConfigRepo = evalConfigRepo;
        this.licenseState = licenseState;
        this.telemetry = telemetry;
        this.logger = logger;
        this.modelResolver = modelResolver;
        this.contextBuilder = contextBuilder;
    }
    async generateInsights(user, workflowId, collectionId, options = {}) {
        if (!this.licenseState.isAiAssistantLicensed()) {
            throw new errors_1.ForbiddenError('AI Assistant license required for eval-collection insights');
        }
        const detail = await this.collectionRepo.getDetailByIdAndWorkflowId(collectionId, workflowId);
        if (!detail) {
            throw new errors_1.NotFoundError('Collection not found');
        }
        if (!options.forceRegenerate && detail.collection.insightsCache) {
            const cached = detail.collection.insightsCache;
            const parsed = api_types_1.aiInsightsResponseSchema.safeParse(cached);
            if (parsed.success && parsed.data.status === 'ok')
                return parsed.data;
        }
        const config = await this.evalConfigRepo.findByIdAndWorkflowId(detail.collection.evaluationConfigId, workflowId);
        const scaleByMetric = config ? (0, api_types_1.metricScalesFromConfig)(config.metrics) : {};
        const summaries = [];
        detail.runs.forEach((run, originalIndex) => {
            if (run.status === 'completed' && run.metrics) {
                summaries.push(this.summariseRun(run, originalIndex, (0, metric_scales_1.runMetricScales)(run, scaleByMetric)));
            }
        });
        if (summaries.length < 2) {
            throw new errors_1.BadRequestError('Collection needs at least 2 completed runs with metrics before insights can be generated');
        }
        const startMs = Date.now();
        let response;
        try {
            const winner = this.pickWinner(summaries);
            if (!winner)
                throw new Error('No scored runs to summarise');
            const { payload, modelId } = await this.invokeAgent({
                user,
                workflowId,
                collectionName: detail.collection.name,
                evaluationConfigId: detail.collection.evaluationConfigId,
                config,
                summaries,
                winner,
            });
            response = {
                generatedAt: new Date().toISOString(),
                modelUsed: modelId,
                status: 'ok',
                insights: payload,
            };
        }
        catch (error) {
            this.logger.debug('Insights agent unavailable; falling back to deterministic summary', {
                collectionId,
                error: error instanceof Error ? error.message : String(error),
            });
            response = {
                generatedAt: new Date().toISOString(),
                modelUsed: exports.DETERMINISTIC_MODEL_TAG,
                status: 'fallback',
                insights: this.buildDeterministicInsights(summaries),
            };
        }
        if (response.status === 'ok') {
            await this.collectionRepo.updateInsightsCache(collectionId, response);
        }
        this.telemetry.track('Eval collection insights generated', {
            user_id: user.id,
            workflow_id: workflowId,
            collection_id: collectionId,
            model_used: response.modelUsed,
            duration_ms: Date.now() - startMs,
            status: response.status,
            regressions_found: response.insights.regressions.length,
        });
        return response;
    }
    summariseRun(run, index, scaleByMetric) {
        const versionLabel = String.fromCharCode(0x41 + index);
        return {
            testRunId: run.id,
            versionLabel,
            workflowVersionId: run.workflowVersionId,
            avgScore: (0, api_types_1.averageNormalizedScore)(run.metrics, scaleByMetric),
            scores: (0, api_types_1.normalizedScores)(run.metrics, scaleByMetric),
            metricScales: scaleByMetric,
        };
    }
    pickWinner(summaries) {
        const scored = summaries.filter((summary) => summary.avgScore !== null);
        if (scored.length === 0)
            return null;
        return scored.reduce((best, summary) => (summary.avgScore > best.avgScore ? summary : best));
    }
    async invokeAgent(params) {
        const { user, workflowId, collectionName, evaluationConfigId, config, summaries, winner } = params;
        const resolved = await this.modelResolver.resolve(user, workflowId, evaluationConfigId, config);
        if (!resolved) {
            throw new Error('No supported LLM judge model configured for insights');
        }
        const context = await this.contextBuilder.build(workflowId, {
            collectionName,
            winnerLabel: winner.versionLabel,
            versions: summaries.map((summary) => ({
                testRunId: summary.testRunId,
                workflowVersionId: summary.workflowVersionId,
                versionLabel: summary.versionLabel,
                avgScore: summary.avgScore,
                scores: summary.scores,
                metricScales: summary.metricScales,
            })),
        });
        const { Agent } = await import('@n8n/agents');
        const agent = new Agent('eval-insights')
            .model(resolved.modelConfig)
            .instructions(INSIGHTS_SYSTEM_PROMPT)
            .structuredOutput(api_types_1.aiInsightsPayloadSchema);
        const payload = await this.generateValidated(agent, this.buildUserPrompt(context), context.baseVersionLabel);
        return { payload: this.reconcile(payload, context), modelId: resolved.modelId };
    }
    reconcile(payload, context) {
        const versionByLabel = new Map(context.versions.map((version) => [version.label, version]));
        const base = versionByLabel.get(context.baseVersionLabel);
        const seen = new Set();
        const regressions = [];
        for (const regression of payload.regressions) {
            if (regression.versionLabel === context.baseVersionLabel)
                continue;
            const versionScore = versionByLabel.get(regression.versionLabel)?.metricScores[regression.metric];
            const baseScore = base?.metricScores[regression.metric];
            if (typeof versionScore !== 'number' || typeof baseScore !== 'number')
                continue;
            if (versionScore >= baseScore)
                continue;
            const key = `${regression.versionLabel} ${regression.metric}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            regressions.push({ ...regression, delta: versionScore - baseScore });
            if (regressions.length >= MAX_REGRESSIONS)
                break;
        }
        return { ...payload, regressions };
    }
    async generateValidated(agent, userPrompt, baseVersionLabel) {
        const attempt = async (prompt) => {
            const result = await agent.generate(prompt, {
                abortSignal: AbortSignal.timeout(INSIGHTS_GENERATE_TIMEOUT_MS),
            });
            const parsed = api_types_1.aiInsightsPayloadSchema.safeParse(result.structuredOutput);
            if (!parsed.success)
                return null;
            if (parsed.data.winner.versionLabel !== baseVersionLabel)
                return null;
            return parsed.data;
        };
        const first = await attempt(userPrompt);
        if (first)
            return first;
        const retry = await attempt(`${userPrompt}\n\nReturn ONLY a JSON object matching the required schema exactly — no extra keys, no prose. The winner's versionLabel MUST be "${baseVersionLabel}".`);
        if (retry)
            return retry;
        throw new Error('LLM insights output failed validation after retry');
    }
    buildUserPrompt(context) {
        return [
            'Compare these workflow versions, all evaluated against the same dataset.',
            `The base version "${context.baseVersionLabel}" is the winner — write the winner card about it`,
            'and set winner.versionLabel to that letter. Scores are percentages (0–100). Ground every',
            'statement in the metric scores, workflow node diffs (including changed prompt text under',
            '`promptChanges`), and regressed cases below.',
            '',
            JSON.stringify(context),
        ].join('\n');
    }
    buildDeterministicInsights(summaries) {
        const scored = summaries.filter((s) => s.avgScore !== null);
        if (scored.length === 0) {
            return {
                winner: {
                    versionLabel: summaries[0]?.versionLabel ?? 'A',
                    headline: 'No scored runs',
                    body: 'No runs in this collection produced numeric metrics yet.',
                },
                regressions: [],
                suggestedNext: {
                    headline: 'Re-run with metric outputs configured',
                    body: 'Add evaluation set-metrics nodes to the workflow so insights can compare runs.',
                    hypothesis: 'Without numeric metrics there is nothing to compare across versions.',
                },
            };
        }
        const winner = scored.reduce((best, s) => (s.avgScore > best.avgScore ? s : best));
        const regressions = this.collectRegressions(scored, winner);
        const suggestedNext = this.composeSuggestedNext(winner, regressions);
        return {
            winner: {
                versionLabel: winner.versionLabel,
                headline: `${winner.versionLabel} is the winner`,
                body: `${winner.versionLabel} leads on average score (${this.formatScore(winner.avgScore)}) across ${Object.keys(winner.scores).length} metric(s).`,
            },
            regressions,
            suggestedNext,
        };
    }
    collectRegressions(scored, winner) {
        const REGRESSION_DELTA_THRESHOLD = 0.1;
        const regressions = [];
        for (const run of scored) {
            if (run.versionLabel === winner.versionLabel)
                continue;
            for (const [metric, winnerScore] of Object.entries(winner.scores)) {
                const runScore = run.scores[metric];
                if (typeof runScore !== 'number')
                    continue;
                const delta = runScore - winnerScore;
                if (delta >= -REGRESSION_DELTA_THRESHOLD)
                    continue;
                const deltaPoints = Number((delta * 100).toFixed(1));
                regressions.push({
                    versionLabel: run.versionLabel,
                    metric,
                    delta: deltaPoints,
                    headline: `${run.versionLabel} regressed on ${metric}`,
                    body: `${run.versionLabel} scored ${this.formatScore(runScore)} on ${metric}, ${Math.abs(deltaPoints).toFixed(1)} percentage points below ${winner.versionLabel}.`,
                });
            }
        }
        return regressions;
    }
    composeSuggestedNext(winner, regressions) {
        if (regressions.length === 0) {
            return {
                headline: `Lock in ${winner.versionLabel} as the baseline`,
                body: `No version regressed sharply against ${winner.versionLabel}. Promote it and use it as the comparison baseline for future experiments.`,
                hypothesis: `${winner.versionLabel} is a solid starting point; further gains require new variants rather than fixing regressions.`,
            };
        }
        const worst = regressions.reduce((w, r) => (r.delta < w.delta ? r : w));
        return {
            headline: `Investigate ${worst.metric} regression on ${worst.versionLabel}`,
            body: `${worst.versionLabel} lost ${Math.abs(worst.delta).toFixed(1)} percentage points on ${worst.metric} vs ${winner.versionLabel}. Try a variant that keeps ${winner.versionLabel}'s configuration for that metric and changes only the rest.`,
            hypothesis: `If isolating ${winner.versionLabel}'s ${worst.metric} configuration into a new variant recovers the lost points, the rest of ${worst.versionLabel}'s changes were the regression's cause.`,
        };
    }
    formatScore(score) {
        return `${Math.round(score * 100)}%`;
    }
};
exports.EvalInsightsService = EvalInsightsService;
exports.EvalInsightsService = EvalInsightsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.EvaluationCollectionRepository, db_1.EvaluationConfigRepository, backend_common_1.LicenseState, telemetry_1.Telemetry, backend_common_1.Logger, insights_model_resolver_1.InsightsModelResolver, insights_context_builder_1.InsightsContextBuilder])
], EvalInsightsService);
//# sourceMappingURL=eval-insights.service.js.map