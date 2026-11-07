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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentEvalService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const p_limit_1 = __importDefault(require("p-limit"));
const errors_1 = require("@n8n/errors");
const check_access_1 = require("../../permissions.ee/check-access");
const credentials_service_1 = require("../../credentials/credentials.service");
const agent_config_service_1 = require("../../modules/agents/agent-config.service");
const agent_repository_1 = require("../../modules/agents/repositories/agent.repository");
const agent_config_hash_1 = require("../../modules/agents/utils/agent-config-hash");
const agent_eval_case_generation_service_1 = require("./agent-eval-case-generation.service");
const agent_eval_instructions_rewrite_1 = require("./agent-eval-instructions-rewrite");
const agent_eval_record_mappers_1 = require("./agent-eval-record-mappers");
const agent_eval_runner_service_1 = require("./agent-eval-runner.service");
const agent_evals_required_modules_1 = require("./agent-evals-required-modules");
const SUGGESTION_RERUN_CONCURRENCY = 3;
const CANCELLABLE_STATUSES = new Set(['new', 'running']);
let AgentEvalService = class AgentEvalService {
    constructor(moduleRegistry, agentRepository, datasetRepository, runRepository, resultRepository, runner, caseGenerationService, agentConfigService, credentialsService, logger) {
        this.moduleRegistry = moduleRegistry;
        this.agentRepository = agentRepository;
        this.datasetRepository = datasetRepository;
        this.runRepository = runRepository;
        this.resultRepository = resultRepository;
        this.runner = runner;
        this.caseGenerationService = caseGenerationService;
        this.agentConfigService = agentConfigService;
        this.credentialsService = credentialsService;
        this.logger = logger;
    }
    async listDatasets(agentId, projectId) {
        await this.assertAgentInProject(agentId, projectId);
        const datasets = await this.datasetRepository.findByAgentId(agentId);
        return datasets.map(agent_eval_record_mappers_1.toDatasetRecord);
    }
    async getDataset(agentId, projectId, datasetId) {
        await this.assertAgentInProject(agentId, projectId);
        return (0, agent_eval_record_mappers_1.toDatasetRecord)(await this.resolveDataset(agentId, datasetId));
    }
    async createDataset(user, agentId, projectId, payload) {
        await this.assertAgentInProject(agentId, projectId);
        if (payload.agentId !== agentId) {
            throw new errors_1.BadRequestError(`The dataset's agentId ('${payload.agentId}') does not match the agent in the URL.`);
        }
        if (payload.datasetSource === 'data_table') {
            await this.assertDataTableReadable(user, payload.datasetRef.dataTableId);
        }
        const dataset = await this.datasetRepository.createDataset({
            name: payload.name,
            description: payload.description ?? null,
            agentId,
            datasetSource: payload.datasetSource,
            datasetRef: payload.datasetRef,
            columnMapping: payload.columnMapping ?? null,
            createdById: user.id,
        });
        return (0, agent_eval_record_mappers_1.toDatasetRecord)(dataset);
    }
    async updateDataset(agentId, projectId, datasetId, payload) {
        await this.assertAgentInProject(agentId, projectId);
        const updated = await this.datasetRepository.updateDataset(datasetId, agentId, payload);
        if (!updated)
            throw new errors_1.NotFoundError(`Agent eval dataset ${datasetId} not found.`);
        return (0, agent_eval_record_mappers_1.toDatasetRecord)(updated);
    }
    async deleteDataset(agentId, projectId, datasetId) {
        await this.assertAgentInProject(agentId, projectId);
        const deleted = await this.datasetRepository.deleteDataset(datasetId, agentId);
        if (!deleted)
            throw new errors_1.NotFoundError(`Agent eval dataset ${datasetId} not found.`);
    }
    async deleteDraftDataset(user, agentId, projectId, datasetId) {
        await this.assertAgentInProject(agentId, projectId);
        const dataset = await this.resolveDataset(agentId, datasetId);
        if ((await this.runRepository.findByDatasetId(datasetId)).length > 0) {
            throw new errors_1.BadRequestError(`Agent eval dataset ${datasetId} already has runs.`);
        }
        const dataTableId = getDataTableId(dataset);
        let mayDeleteTable = false;
        if (dataTableId !== null) {
            try {
                mayDeleteTable =
                    (await (0, check_access_1.userHasScopes)(user, ['dataTable:delete'], false, { dataTableId })) &&
                        !(await this.datasetRepository.isDataTableReadByOtherDataset(dataTableId, datasetId));
            }
            catch (error) {
                if (!(error instanceof errors_1.NotFoundError))
                    throw error;
            }
        }
        if (dataTableId !== null && mayDeleteTable) {
            try {
                await this.caseGenerationService.deleteDraftTable(dataTableId, projectId);
            }
            catch (error) {
                if (!(error instanceof errors_1.NotFoundError))
                    throw error;
            }
        }
        const deleted = await this.datasetRepository.deleteDataset(datasetId, agentId);
        if (!deleted)
            throw new errors_1.NotFoundError(`Agent eval dataset ${datasetId} not found.`);
    }
    async generateDraftCases(user, agentId, projectId, options) {
        await this.assertAgentInProject(agentId, projectId);
        return await this.caseGenerationService.generateDraftCases(user, projectId, agentId, options);
    }
    async createDraftDataset(user, agentId, projectId, datasetName) {
        await this.assertAgentInProject(agentId, projectId);
        return await this.caseGenerationService.createEmptyDataset(user, projectId, agentId, datasetName);
    }
    async previewRun(user, agentId, projectId, options) {
        await this.assertAgentInProject(agentId, projectId);
        return await this.caseGenerationService.previewRun(user, projectId, agentId, options);
    }
    async applyPreviewSuggestion(user, agentId, projectId, options, pushRef) {
        await this.assertAgentInProject(agentId, projectId);
        if (!(await (0, check_access_1.userHasScopes)(user, ['agent:execute'], false, { projectId }))) {
            throw new errors_1.ForbiddenError('You do not have permission to run agents in this project.');
        }
        const config = await this.agentConfigService.getConfig(agentId, projectId);
        const baseConfigHash = (0, agent_config_hash_1.getAgentConfigHash)(config);
        const instructions = await (0, agent_eval_instructions_rewrite_1.rewriteAgentInstructions)({
            agentConfigService: this.agentConfigService,
            credentialsService: this.credentialsService,
            logger: this.logger,
        }, {
            currentInstructions: config.instructions,
            suggestions: [{ suggestion: options.suggestion, rule: options.whatToCheck }],
        }, { agentId, projectId, user });
        const saved = await this.agentConfigService.updateConfig(agentId, projectId, { ...config, instructions }, user, { baseConfigHash, modifiedBy: 'user', pushRef });
        const preview = await this.caseGenerationService.runPreviewCase(user, projectId, agentId, {
            input: options.input,
            whatToCheck: options.whatToCheck,
            scenario: '',
        });
        return { configHash: saved.configHash, preview };
    }
    async startRun(user, agentId, projectId, datasetId, payload) {
        await this.assertAgentInProject(agentId, projectId);
        await this.resolveDataset(agentId, datasetId);
        if (payload.agentVersionId !== undefined) {
            throw new errors_1.BadRequestError('Pinning an agent version for an eval run is not supported yet.');
        }
        const { runId } = await this.runner.startRun(datasetId, projectId, user);
        const run = await this.runRepository.findById(runId);
        if (!run)
            throw new errors_1.NotFoundError(`Agent eval run ${runId} not found.`);
        return (0, agent_eval_record_mappers_1.toRunRecord)(run);
    }
    async listRuns(agentId, projectId, datasetId, page) {
        await this.assertAgentInProject(agentId, projectId);
        await this.resolveDataset(agentId, datasetId);
        const [runs, count] = await this.runRepository.findAndCountByDatasetIdAndAgentId(datasetId, agentId, page);
        return { count, data: runs.map(agent_eval_record_mappers_1.toRunRecord) };
    }
    async getRunDetail(user, agentId, projectId, runId, page) {
        await this.assertAgentInProject(agentId, projectId);
        const run = await this.resolveRun(agentId, runId);
        await this.assertDatasetSourceReadable(user, await this.resolveDataset(agentId, run.datasetId));
        const [results, count] = await this.resultRepository.findAndCountByRunId(runId, page);
        return { ...(0, agent_eval_record_mappers_1.toRunRecord)(run), results: { count, data: results.map(agent_eval_record_mappers_1.toResultRecord) } };
    }
    async getRunSummary(agentId, projectId, runId) {
        await this.assertAgentInProject(agentId, projectId);
        return await this.runner.getRunSummary(runId, agentId);
    }
    async rerunResult(user, agentId, projectId, resultId, options = {}) {
        await this.assertAgentInProject(agentId, projectId);
        const result = await this.resolveResult(agentId, resultId);
        if (result.status === 'new' || result.status === 'running') {
            throw new errors_1.BadRequestError(`Agent eval result ${resultId} is already running.`);
        }
        const updated = await this.runner.rerunResult(result, agentId, projectId, user, options);
        return (0, agent_eval_record_mappers_1.toResultRecord)(updated);
    }
    async applySuggestions(user, agentId, projectId, resultIds, pushRef) {
        await this.assertAgentInProject(agentId, projectId);
        if (!(await (0, check_access_1.userHasScopes)(user, ['agent:execute'], false, { projectId }))) {
            throw new errors_1.ForbiddenError('You do not have permission to run agents in this project.');
        }
        const uniqueIds = [...new Set(resultIds)];
        const results = await Promise.all(uniqueIds.map(async (id) => await this.resolveResult(agentId, id)));
        const invalidIds = results
            .filter((result) => readFailedRuleSuggestion(result) === null)
            .map((result) => result.id);
        if (invalidIds.length > 0) {
            throw new errors_1.BadRequestError(`These results have no fix suggestion to apply: ${invalidIds.join(', ')}.`);
        }
        const config = await this.agentConfigService.getConfig(agentId, projectId);
        const baseConfigHash = (0, agent_config_hash_1.getAgentConfigHash)(config);
        const instructions = await (0, agent_eval_instructions_rewrite_1.rewriteAgentInstructions)({
            agentConfigService: this.agentConfigService,
            credentialsService: this.credentialsService,
            logger: this.logger,
        }, {
            currentInstructions: config.instructions,
            suggestions: results.map((result) => ({
                suggestion: readFailedRuleSuggestion(result) ?? '',
                rule: readCriteria(result),
            })),
        }, { agentId, projectId, user });
        const saved = await this.agentConfigService.updateConfig(agentId, projectId, { ...config, instructions }, user, { baseConfigHash, modifiedBy: 'user', pushRef });
        const limit = (0, p_limit_1.default)(SUGGESTION_RERUN_CONCURRENCY);
        const settled = await Promise.allSettled(results.map(async (result) => await limit(async () => await this.runner.rerunResult(result, agentId, projectId, user))));
        const failures = settled.filter((entry) => entry.status === 'rejected');
        if (failures.length === settled.length) {
            const { reason } = failures[0];
            throw reason instanceof Error ? reason : new errors_1.OperationalError(String(reason));
        }
        const rows = await Promise.all(settled.map(async (entry, index) => {
            if (entry.status === 'fulfilled')
                return entry.value;
            const refreshed = await this.resultRepository.findById(results[index].id);
            return refreshed ?? results[index];
        }));
        return { configHash: saved.configHash, results: rows.map(agent_eval_record_mappers_1.toResultRecord) };
    }
    async acceptResult(agentId, projectId, resultId) {
        await this.assertAgentInProject(agentId, projectId);
        const result = await this.resolveResult(agentId, resultId);
        if (result.status === 'new' || result.status === 'running') {
            throw new errors_1.BadRequestError(`Agent eval result ${resultId} has not finished.`);
        }
        const verdict = { status: 'completed', outcome: 'pass', reasoning: null };
        await this.resultRepository.updateVerdict(resultId, verdict);
        const refreshed = await this.resultRepository.findById(resultId);
        if (!refreshed)
            throw new errors_1.NotFoundError(`Agent eval result ${resultId} not found.`);
        return (0, agent_eval_record_mappers_1.toResultRecord)(refreshed);
    }
    async deleteResult(agentId, projectId, resultId) {
        await this.assertAgentInProject(agentId, projectId);
        const result = await this.resolveResult(agentId, resultId);
        if (result.status === 'new' || result.status === 'running') {
            throw new errors_1.BadRequestError(`Agent eval result ${resultId} is still running.`);
        }
        const deleted = await this.resultRepository.deleteById(resultId, result.runId);
        if (!deleted)
            throw new errors_1.NotFoundError(`Agent eval result ${resultId} not found.`);
        const run = await this.runRepository.findById(result.runId);
        if (run?.metrics) {
            const { counts } = await this.runner.getRunSummary(run.id, agentId);
            await this.runRepository.updateMetrics(run.id, { ...run.metrics, ...counts });
        }
    }
    async cancelRun(agentId, projectId, runId) {
        await this.assertAgentInProject(agentId, projectId);
        const run = await this.resolveRun(agentId, runId);
        if (!CANCELLABLE_STATUSES.has(run.status)) {
            throw new errors_1.BadRequestError(`Agent eval run ${runId} has already finished ('${run.status}').`);
        }
        await this.runRepository.requestCancellation(runId);
        const updated = await this.runRepository.findById(runId);
        return (0, agent_eval_record_mappers_1.toRunRecord)(updated ?? run);
    }
    async assertAgentInProject(agentId, projectId) {
        (0, agent_evals_required_modules_1.assertRequiredModulesActive)(this.moduleRegistry);
        const agent = await this.agentRepository.findByIdAndProjectId(agentId, projectId);
        if (!agent)
            throw new errors_1.NotFoundError(`Agent ${agentId} not found.`);
    }
    async resolveDataset(agentId, datasetId) {
        const dataset = await this.datasetRepository.findByIdAndAgentId(datasetId, agentId);
        if (!dataset)
            throw new errors_1.NotFoundError(`Agent eval dataset ${datasetId} not found.`);
        return dataset;
    }
    async assertDatasetSourceReadable(user, dataset) {
        if (dataset.datasetSource !== 'data_table')
            return;
        if (!('dataTableId' in dataset.datasetRef)) {
            throw new n8n_workflow_1.UnexpectedError(`Agent eval dataset ${dataset.id} has a 'data_table' source without a table id.`);
        }
        await this.assertDataTableReadable(user, dataset.datasetRef.dataTableId);
    }
    async assertDataTableReadable(user, dataTableId) {
        const allowed = await (0, check_access_1.userHasScopes)(user, ['dataTable:readRow'], false, { dataTableId });
        if (!allowed)
            throw new errors_1.ForbiddenError('You do not have access to this dataset.');
    }
    async resolveRun(agentId, runId) {
        const run = await this.runRepository.findByIdAndAgentId(runId, agentId);
        if (!run)
            throw new errors_1.NotFoundError(`Agent eval run ${runId} not found.`);
        return run;
    }
    async resolveResult(agentId, resultId) {
        const notFound = () => new errors_1.NotFoundError(`Agent eval result ${resultId} not found.`);
        const result = await this.resultRepository.findById(resultId);
        if (!result)
            throw notFound();
        const run = await this.runRepository.findByIdAndAgentId(result.runId, agentId);
        if (!run)
            throw notFound();
        return result;
    }
};
exports.AgentEvalService = AgentEvalService;
exports.AgentEvalService = AgentEvalService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.ModuleRegistry, agent_repository_1.AgentRepository, db_1.AgentEvalDatasetRepository, db_1.AgentEvalRunRepository, db_1.AgentEvalResultRepository, agent_eval_runner_service_1.AgentEvalRunnerService, agent_eval_case_generation_service_1.AgentEvalCaseGenerationService, agent_config_service_1.AgentConfigService, credentials_service_1.CredentialsService, backend_common_1.Logger])
], AgentEvalService);
function readFailedRuleSuggestion(result) {
    if (result.status === 'new' || result.status === 'running')
        return null;
    const verdict = result.verdict;
    if (!verdict || verdict.status !== 'completed' || verdict.outcome !== 'fail')
        return null;
    const suggestion = verdict.suggestion;
    return typeof suggestion === 'string' && suggestion.trim().length > 0 ? suggestion.trim() : null;
}
function readCriteria(result) {
    const criteria = result.input?.criteria;
    return typeof criteria === 'string' && criteria.length > 0 ? criteria : null;
}
function getDataTableId(dataset) {
    if (dataset.datasetSource !== 'data_table')
        return null;
    return 'dataTableId' in dataset.datasetRef ? dataset.datasetRef.dataTableId : null;
}
//# sourceMappingURL=agent-eval.service.js.map