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
exports.AgentEvalRunnerService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const p_limit_1 = __importDefault(require("p-limit"));
const concurrency_control_service_1 = require("../../concurrency/concurrency-control.service");
const credentials_service_1 = require("../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const evaluation_concurrency_helper_1 = require("../../evaluation.ee/evaluation-concurrency.helper");
const license_1 = require("../../license");
const agent_config_service_1 = require("../../modules/agents/agent-config.service");
const agents_settings_service_1 = require("../../modules/agents/agents-settings.service");
const agent_repository_1 = require("../../modules/agents/repositories/agent.repository");
const data_table_service_1 = require("../../modules/data-table/data-table.service");
const agent_execution_service_1 = require("../../modules/instance-ai/eval/agent-execution.service");
const check_access_1 = require("../../permissions.ee/check-access");
const agent_eval_fix_suggestion_1 = require("./agent-eval-fix-suggestion");
const agent_eval_judge_1 = require("./agent-eval-judge");
const agent_evals_flag_gate_1 = require("./agent-evals-flag-gate");
const agent_evals_required_modules_1 = require("./agent-evals-required-modules");
const ROW_PAGE_SIZE = 100;
const MAX_PER_RUN_CONCURRENCY = 10;
const MAX_CASES = 500;
const MAX_TIMER_DELAY_MS = 2_147_483_647;
let AgentEvalRunnerService = class AgentEvalRunnerService {
    constructor(logger, globalConfig, instanceSettings, moduleRegistry, datasetRepository, runRepository, resultRepository, agentRepository, dataTableService, evalAgentExecutionService, concurrencyControl, license, flagGate, agentsSettingsService, agentConfigService, credentialsService) {
        this.logger = logger;
        this.globalConfig = globalConfig;
        this.instanceSettings = instanceSettings;
        this.moduleRegistry = moduleRegistry;
        this.datasetRepository = datasetRepository;
        this.runRepository = runRepository;
        this.resultRepository = resultRepository;
        this.agentRepository = agentRepository;
        this.dataTableService = dataTableService;
        this.evalAgentExecutionService = evalAgentExecutionService;
        this.concurrencyControl = concurrencyControl;
        this.license = license;
        this.flagGate = flagGate;
        this.agentsSettingsService = agentsSettingsService;
        this.agentConfigService = agentConfigService;
        this.credentialsService = credentialsService;
    }
    async startRun(datasetId, projectId, user, options = {}) {
        await this.flagGate.assertEnabled(user);
        if (this.globalConfig.executions.mode === 'queue') {
            throw new errors_1.BadRequestError('Agent eval runs are not supported in queue mode.');
        }
        (0, agent_evals_required_modules_1.assertRequiredModulesActive)(this.moduleRegistry);
        await this.agentsSettingsService.assertEnabled();
        if (!(await (0, check_access_1.userHasScopes)(user, ['agent:execute'], false, { projectId }))) {
            throw new errors_1.ForbiddenError('You do not have permission to run agents in this project.');
        }
        const dataset = await this.datasetRepository.findById(datasetId);
        if (!dataset)
            throw new errors_1.NotFoundError(`Agent eval dataset ${datasetId} not found.`);
        if (dataset.datasetSource !== 'data_table') {
            throw new errors_1.BadRequestError(`Agent eval runs currently support only data_table datasets (got '${dataset.datasetSource}').`);
        }
        const agent = await this.agentRepository.findByIdAndProjectId(dataset.agentId, projectId);
        if (!agent) {
            throw new errors_1.NotFoundError(`Agent ${dataset.agentId} not found or not accessible.`);
        }
        const cases = await this.resolveCases(dataset, user);
        if (cases.length === 0) {
            throw new errors_1.BadRequestError('The dataset has no rows to run.');
        }
        const run = await this.runRepository.createRun({
            datasetId: dataset.id,
            agentVersionId: null,
            createdById: user.id,
        });
        let seeded;
        try {
            seeded = await this.resultRepository.seedResults(cases.map((c, index) => ({
                runId: run.id,
                sourceRowId: c.sourceRowId,
                runIndex: index,
                input: c.snapshot,
            })));
            await this.runRepository.markAsRunning(run.id, this.instanceSettings.hostId);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            try {
                await this.runRepository.markAsError(run.id, 'seed_failed', { message });
            }
            catch {
            }
            throw error;
        }
        const finished = this.executeRun({
            runId: run.id,
            agentId: dataset.agentId,
            projectId,
            user,
            cases,
            seeded,
            timeoutMs: options.timeoutMs,
        });
        return { runId: run.id, finished };
    }
    async rerunResult(result, agentId, projectId, user, options = {}) {
        await this.flagGate.assertEnabled(user);
        if (this.globalConfig.executions.mode === 'queue') {
            throw new errors_1.BadRequestError('Agent eval runs are not supported in queue mode.');
        }
        (0, agent_evals_required_modules_1.assertRequiredModulesActive)(this.moduleRegistry);
        if (!(await (0, check_access_1.userHasScopes)(user, ['agent:execute'], false, { projectId }))) {
            throw new errors_1.ForbiddenError('You do not have permission to run agents in this project.');
        }
        if (options.whatToCheck !== undefined &&
            !(await (0, check_access_1.userHasScopes)(user, ['agent:update'], false, { projectId }))) {
            throw new errors_1.ForbiddenError('You do not have permission to edit checks in this project.');
        }
        const input = readResultInputText(result.input);
        if (!input) {
            throw new errors_1.BadRequestError('This case has no input to rerun.');
        }
        if (!(await this.resultRepository.claimForRerun(result.id))) {
            throw new errors_1.BadRequestError(`Agent eval result ${result.id} is already running.`);
        }
        let caseToRun = result;
        if (options.whatToCheck !== undefined) {
            try {
                const snapshot = toJsonObject({ ...(result.input ?? {}), criteria: options.whatToCheck });
                await this.resultRepository.updateInput(result.id, snapshot);
                caseToRun = { ...result, input: snapshot };
            }
            catch (error) {
                await this.resultRepository.markAsError(result.id, 'rerun_failed', {
                    message: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        }
        await this.runCase(caseToRun, { sourceRowId: caseToRun.sourceRowId, input, snapshot: caseToRun.input ?? {} }, { agentId, projectId, user, timeoutMs: options.timeoutMs });
        const refreshed = await this.resultRepository.findById(result.id);
        if (!refreshed)
            throw new errors_1.NotFoundError(`Agent eval result ${result.id} not found.`);
        return refreshed;
    }
    async getRunSummary(runId, agentId) {
        const run = await this.runRepository.findByIdAndAgentId(runId, agentId);
        if (!run)
            throw new errors_1.NotFoundError(`Agent eval run ${runId} not found.`);
        const counts = await this.resultRepository.countByStatus(runId);
        return { runId: run.id, status: run.status, counts: toSummaryCounts(counts) };
    }
    async executeRun(ctx) {
        const { runId, cases, seeded } = ctx;
        if (seeded.length !== cases.length) {
            await this.failRun(runId, `Seeded ${seeded.length} results for ${cases.length} cases`);
            return;
        }
        try {
            const resolvedLimit = (0, evaluation_concurrency_helper_1.resolveEvaluationConcurrencyLimit)(this.globalConfig.executions, this.license);
            const limit = (0, p_limit_1.default)(resolvedLimit > 0
                ? Math.min(resolvedLimit, MAX_PER_RUN_CONCURRENCY)
                : MAX_PER_RUN_CONCURRENCY);
            const abort = new AbortController();
            const totalUsage = { inputTokens: 0, outputTokens: 0 };
            let cancelObserved = false;
            const shouldStopCase = async () => {
                if (abort.signal.aborted)
                    return true;
                if (!(await this.runRepository.isCancellationRequested(runId)))
                    return false;
                cancelObserved = true;
                abort.abort();
                return true;
            };
            let stoppedCases = 0;
            const stopCase = async (resultRow) => {
                stoppedCases++;
                await this.resultRepository.markAsCancelled(resultRow.id);
            };
            const markEmptyInput = async (resultRow) => {
                try {
                    await this.resultRepository.markAsError(resultRow.id, 'empty_input', {
                        message: 'Case has no value in the mapped input column.',
                    });
                }
                catch (error) {
                    this.logger.error(`[AgentEvalRunner] Could not record empty input for case ${resultRow.id}`, { error: error instanceof Error ? error.message : String(error) });
                }
            };
            const deadline = this.startRunDeadline(abort);
            const settlements = await Promise.allSettled(cases.map(async (resolvedCase, index) => await limit(async () => {
                const resultRow = seeded[index];
                if (await shouldStopCase()) {
                    await stopCase(resultRow);
                    return;
                }
                if (resolvedCase.input.trim().length === 0) {
                    await markEmptyInput(resultRow);
                    return;
                }
                const executionId = `agent-eval:${runId}-case-${index}`;
                if (!(await this.acquireEvaluationSlot(executionId, abort.signal))) {
                    await stopCase(resultRow);
                    return;
                }
                try {
                    if (await shouldStopCase()) {
                        await stopCase(resultRow);
                        return;
                    }
                    const usage = await this.runCase(resultRow, resolvedCase, ctx);
                    if (usage) {
                        totalUsage.inputTokens += usage.inputTokens;
                        totalUsage.outputTokens += usage.outputTokens;
                    }
                }
                finally {
                    this.concurrencyControl.release({ mode: 'evaluation' });
                }
            })));
            deadline.clear();
            const dispatchFailures = [];
            for (const settlement of settlements) {
                if (settlement.status !== 'rejected')
                    continue;
                const reason = settlement.reason;
                dispatchFailures.push(reason instanceof Error ? reason.message : String(reason));
            }
            let wasCancelled = cancelObserved;
            if (!wasCancelled) {
                try {
                    wasCancelled = await this.runRepository.isCancellationRequested(runId);
                }
                catch (error) {
                    dispatchFailures.push(error instanceof Error ? error.message : String(error));
                }
            }
            if (dispatchFailures.length > 0) {
                this.logger.error(`[AgentEvalRunner] ${dispatchFailures.length} failure(s) outside case execution in run ${runId}`, { errors: dispatchFailures });
            }
            const counts = await this.resultRepository.countByStatus(runId);
            const metrics = { ...toSummaryCounts(counts), usage: { ...totalUsage } };
            if (wasCancelled) {
                await this.runRepository.markAsCancelled(runId, metrics);
            }
            else if (deadline.hasExpired() && stoppedCases > 0) {
                await this.runRepository.markAsError(runId, 'timeout', {
                    message: `Run exceeded its ${deadline.deadlineMinutes}-minute deadline; ${stoppedCases} case(s) were not started.`,
                }, metrics);
            }
            else if (dispatchFailures.length > 0) {
                await this.runRepository.markAsError(runId, 'case_dispatch_failed', {
                    message: `${dispatchFailures.length} failure(s) occurred outside case execution.`,
                    errors: dispatchFailures,
                }, metrics);
            }
            else {
                if (deadline.hasExpired()) {
                    this.logger.debug(`[AgentEvalRunner] Run ${runId} overran its ${deadline.deadlineMinutes}-minute deadline, but every case had finished`);
                }
                await this.runRepository.markAsCompleted(runId, metrics);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await this.failRun(runId, message);
        }
    }
    startRunDeadline(abort) {
        const deadlineMinutes = this.globalConfig.evaluation.agentEvalsRunTimeoutMinutes;
        if (deadlineMinutes <= 0) {
            return { hasExpired: () => false, clear: () => undefined, deadlineMinutes };
        }
        let expired = false;
        const timer = setTimeout(() => {
            expired = true;
            abort.abort();
        }, Math.min(deadlineMinutes * 60_000, MAX_TIMER_DELAY_MS));
        timer.unref();
        return { hasExpired: () => expired, clear: () => clearTimeout(timer), deadlineMinutes };
    }
    async acquireEvaluationSlot(executionId, signal) {
        if (signal.aborted)
            return false;
        let onAbort;
        const aborted = new Promise((resolve) => {
            onAbort = () => resolve('aborted');
            signal.addEventListener('abort', onAbort, { once: true });
        });
        const acquire = this.concurrencyControl.throttle({ mode: 'evaluation', executionId });
        const outcome = await Promise.race([acquire.then(() => 'acquired'), aborted]);
        if (onAbort)
            signal.removeEventListener('abort', onAbort);
        if (outcome === 'aborted') {
            this.concurrencyControl.remove({ mode: 'evaluation', executionId });
            void acquire.then(() => this.concurrencyControl.release({ mode: 'evaluation' }));
            return false;
        }
        return true;
    }
    async failRun(runId, message) {
        this.logger.error(`[AgentEvalRunner] Run ${runId} failed to complete`, { error: message });
        try {
            await this.runRepository.markAsError(runId, 'run_failed', { message });
        }
        catch (markError) {
            this.logger.error(`[AgentEvalRunner] Could not mark run ${runId} as errored`, {
                error: markError instanceof Error ? markError.message : String(markError),
            });
        }
    }
    async cleanupInterruptedRuns() {
        if (this.globalConfig.executions.mode === 'queue')
            return;
        try {
            const result = await this.runRepository.markAllIncompleteAsError();
            if (result.affected && result.affected > 0) {
                this.logger.debug(`[AgentEvalRunner] Marked ${result.affected} interrupted run(s) as errored on startup`);
            }
        }
        catch (error) {
            this.logger.error('[AgentEvalRunner] Failed to clean up interrupted runs on startup', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async runCase(resultRow, resolvedCase, ctx) {
        try {
            await this.resultRepository.markAsRunning(resultRow.id);
            const execResult = await this.evalAgentExecutionService.executeWithLlmMock(ctx.agentId, ctx.user, { projectId: ctx.projectId, ...(ctx.timeoutMs ? { timeoutMs: ctx.timeoutMs } : {}) }, resolvedCase.input);
            const usage = normalizeUsage(execResult.usage);
            if (!execResult.success) {
                await this.resultRepository.markAsError(resultRow.id, 'execution_failed', {
                    errors: execResult.errors,
                    finalText: execResult.finalText,
                });
                return usage;
            }
            let verdict = null;
            try {
                const judged = await this.judgeCase(resolvedCase, execResult.finalText, ctx);
                const suggestion = await this.suggestFix(judged, resolvedCase, execResult.finalText, ctx);
                verdict = toJsonObject(suggestion ? { ...judged, suggestion } : judged);
            }
            catch (error) {
                this.logger.error(`[AgentEvalRunner] Could not judge case ${resultRow.id}`, {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            await this.resultRepository.markAsCompleted(resultRow.id, {
                output: toJsonObject({
                    finalText: execResult.finalText,
                    model: execResult.model ?? null,
                    finishReason: execResult.finishReason ?? null,
                    skippedFeatures: execResult.skippedFeatures,
                }),
                toolCalls: toJsonObject({ calls: execResult.toolCalls }),
                metrics: usage ? { usage: { ...usage } } : null,
                verdict,
            });
            return usage;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`[AgentEvalRunner] Case ${resultRow.id} failed`, { error: message });
            try {
                await this.resultRepository.markAsError(resultRow.id, 'execution_failed', { message });
            }
            catch (markError) {
                this.logger.error(`[AgentEvalRunner] Could not record failure for case ${resultRow.id}`, {
                    error: markError instanceof Error ? markError.message : String(markError),
                });
            }
            return undefined;
        }
    }
    async judgeCase(resolvedCase, output, ctx) {
        return await (0, agent_eval_judge_1.judgeAgentAnswer)({
            agentConfigService: this.agentConfigService,
            credentialsService: this.credentialsService,
            logger: this.logger,
        }, {
            input: resolvedCase.input,
            output,
            criteria: readSnapshotText(resolvedCase.snapshot, 'criteria'),
            expectedOutput: readSnapshotText(resolvedCase.snapshot, 'expectedOutput'),
        }, ctx);
    }
    async suggestFix(verdict, resolvedCase, output, ctx) {
        if (verdict.status !== 'completed' || verdict.outcome !== 'fail')
            return null;
        const rule = readSnapshotText(resolvedCase.snapshot, 'criteria');
        if (!rule)
            return null;
        return await (0, agent_eval_fix_suggestion_1.generateFixSuggestion)({
            agentConfigService: this.agentConfigService,
            credentialsService: this.credentialsService,
            logger: this.logger,
        }, { input: resolvedCase.input, output, rule, reasoning: verdict.reasoning }, ctx);
    }
    async resolveCases(dataset, user) {
        const mapping = dataset.columnMapping;
        if (!mapping?.input) {
            throw new errors_1.BadRequestError('The dataset has no input column mapping.');
        }
        const dataTableId = dataset.datasetRef.dataTableId;
        const allowed = await (0, check_access_1.userHasScopes)(user, ['dataTable:readRow'], false, { dataTableId });
        if (!allowed)
            throw new errors_1.ForbiddenError('You do not have access to this dataset.');
        const tableProjectId = await this.dataTableService.getProjectIdForDataTable(dataTableId);
        const columnNames = new Set((await this.dataTableService.getColumns(dataTableId, tableProjectId)).map((c) => c.name));
        const missing = [
            ['input', mapping.input],
            ['expectedOutput', mapping.expectedOutput],
            ['criteria', mapping.criteria],
        ]
            .filter(([, name]) => name && !columnNames.has(name))
            .map(([role, name]) => `${role} → '${name}'`);
        if (missing.length > 0) {
            throw new errors_1.BadRequestError(`The dataset's column mapping references columns missing from the data table: ${missing.join(', ')}.`);
        }
        const rows = [];
        let skip = 0;
        for (;;) {
            const { data, count } = await this.dataTableService.getManyRowsAndCount(dataTableId, tableProjectId, { take: ROW_PAGE_SIZE, skip });
            if (count > MAX_CASES) {
                throw new errors_1.BadRequestError(`The dataset has ${count} rows, exceeding the ${MAX_CASES}-case limit for a single run.`);
            }
            rows.push(...data);
            skip += data.length;
            if (data.length === 0 || skip >= count)
                break;
        }
        return rows.map((row) => {
            const snapshot = { input: cellToJson(row[mapping.input]) };
            if (mapping.expectedOutput) {
                snapshot.expectedOutput = cellToJson(row[mapping.expectedOutput]);
            }
            if (mapping.criteria)
                snapshot.criteria = cellToJson(row[mapping.criteria]);
            return {
                sourceRowId: row.id === undefined || row.id === null ? null : String(row.id),
                input: cellToString(row[mapping.input]),
                snapshot,
            };
        });
    }
};
exports.AgentEvalRunnerService = AgentEvalRunnerService;
exports.AgentEvalRunnerService = AgentEvalRunnerService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, n8n_core_1.InstanceSettings, backend_common_1.ModuleRegistry, db_1.AgentEvalDatasetRepository, db_1.AgentEvalRunRepository, db_1.AgentEvalResultRepository, agent_repository_1.AgentRepository, data_table_service_1.DataTableService, agent_execution_service_1.EvalAgentExecutionService, concurrency_control_service_1.ConcurrencyControlService, license_1.License, agent_evals_flag_gate_1.AgentEvalsFlagGate, agents_settings_service_1.AgentsSettingsService, agent_config_service_1.AgentConfigService, credentials_service_1.CredentialsService])
], AgentEvalRunnerService);
function toSummaryCounts(counts) {
    return {
        total: counts.new + counts.running + counts.success + counts.error + counts.cancelled,
        success: counts.success,
        error: counts.error,
        cancelled: counts.cancelled,
        pending: counts.new + counts.running,
    };
}
function normalizeUsage(usage) {
    if (!usage)
        return undefined;
    return { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 };
}
function readSnapshotText(snapshot, key) {
    const value = snapshot[key];
    if (typeof value === 'string' && value.length > 0)
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    return null;
}
function cellToString(value) {
    if (value === null || value === undefined)
        return '';
    if (value instanceof Date)
        return value.toISOString();
    return String(value);
}
function cellToJson(value) {
    if (value === null || value === undefined)
        return null;
    if (value instanceof Date)
        return value.toISOString();
    return value;
}
function toJsonObject(value) {
    return (0, n8n_workflow_1.jsonParse)((0, n8n_workflow_1.jsonStringify)(value), { fallbackValue: {} });
}
function readResultInputText(input) {
    if (!input)
        return null;
    const value = input.input;
    if (typeof value === 'string' && value.trim().length > 0)
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    return null;
}
//# sourceMappingURL=agent-eval-runner.service.js.map