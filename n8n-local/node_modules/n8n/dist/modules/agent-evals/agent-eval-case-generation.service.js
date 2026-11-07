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
exports.AgentEvalCaseGenerationService = void 0;
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_service_1 = require("../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const agent_eval_fix_suggestion_1 = require("./agent-eval-fix-suggestion");
const agent_eval_judge_1 = require("./agent-eval-judge");
const agent_evals_flag_gate_1 = require("./agent-evals-flag-gate");
const agent_config_service_1 = require("../agents/agent-config.service");
const agent_test_run_service_1 = require("../agents/agent-test-run.service");
const case_generation_prompt_1 = require("./case-generation/case-generation-prompt");
const dimensions_1 = require("./case-generation/dimensions");
const credential_field_mapping_1 = require("../agents/json-config/credential-field-mapping");
const model_config_1 = require("../agents/json-config/model-config");
const agent_credential_provider_1 = require("../agents/utils/agent-credential-provider");
const data_table_service_1 = require("../data-table/data-table.service");
const data_table_name_conflict_error_1 = require("../data-table/errors/data-table-name-conflict.error");
const DEFAULT_CASE_COUNT = 6;
const MAX_CASE_COUNT = 20;
const MAX_CASE_TEXT_CHARS = 2_000;
const MAX_SCENARIO_CHARS = 40;
const GENERATE_TIMEOUT_MS = 60_000;
const INPUT_COLUMN = 'input';
const CRITERIA_COLUMN = 'criteria';
const MAX_NAME_ATTEMPTS = 20;
let AgentEvalCaseGenerationService = class AgentEvalCaseGenerationService {
    constructor(logger, agentConfigService, credentialsService, dataTableService, datasetRepository, flagGate, instanceWriteAccess, agentTestRunService) {
        this.logger = logger;
        this.agentConfigService = agentConfigService;
        this.credentialsService = credentialsService;
        this.dataTableService = dataTableService;
        this.datasetRepository = datasetRepository;
        this.flagGate = flagGate;
        this.instanceWriteAccess = instanceWriteAccess;
        this.agentTestRunService = agentTestRunService;
    }
    async generateDraftCases(user, projectId, agentId, options = {}) {
        await this.flagGate.assertEnabled(user);
        this.assertInstanceWriteAccess();
        const config = await this.agentConfigService.getConfig(agentId, projectId);
        const modelConfig = await this.resolveAgentModel(config, projectId, user);
        const revision = toRevisionContext(options);
        const rule = options.rule?.trim() || undefined;
        const count = revision || rule ? 1 : clampCount(options.count);
        const capabilities = (0, case_generation_prompt_1.deriveCapabilities)(config);
        const tuples = (0, dimensions_1.sampleDimensionTuples)(capabilities, count);
        const example = toExampleContext(options);
        const summary = (0, case_generation_prompt_1.buildAgentSummary)(config);
        const generated = await this.invokeModel(modelConfig, (0, case_generation_prompt_1.buildCaseGenerationUserPrompt)(summary, tuples, revision, example, rule), tuples.length);
        const cases = boundCases(generated, tuples.length);
        if (options.save === false) {
            this.logger.debug('Generated draft eval cases (preview, not persisted)', {
                agentId,
                caseCount: cases.length,
            });
            return { cases };
        }
        const trimmedName = options.datasetName?.trim();
        const baseName = trimmedName && trimmedName.length > 0 ? trimmedName : defaultDatasetName(config.name);
        const { datasetId, dataTableId } = await this.persistDataset(projectId, agentId, user.id, baseName, cases);
        this.logger.debug('Generated draft eval cases', {
            agentId,
            datasetId,
            caseCount: cases.length,
        });
        return { datasetId, dataTableId, cases };
    }
    async createEmptyDataset(user, projectId, agentId, datasetName) {
        await this.flagGate.assertEnabled(user);
        this.assertInstanceWriteAccess();
        const config = await this.agentConfigService.getConfig(agentId, projectId);
        const trimmedName = datasetName?.trim();
        const baseName = trimmedName && trimmedName.length > 0 ? trimmedName : defaultDatasetName(config.name);
        return await this.persistDataset(projectId, agentId, user.id, baseName, []);
    }
    async previewRun(user, projectId, agentId, options = {}) {
        const drafted = await this.generateDraftCases(user, projectId, agentId, {
            ...options,
            count: 1,
            save: false,
        });
        const draftCase = drafted.cases[0];
        if (!draftCase)
            return { status: 'failed' };
        return await this.runPreviewCase(user, projectId, agentId, draftCase);
    }
    async runPreviewCase(user, projectId, agentId, draftCase) {
        const credentialProvider = (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, projectId, user, agentId);
        const result = await this.agentTestRunService.executeDraftRun({
            agentId,
            projectId,
            user,
            message: draftCase.input,
            credentialProvider,
            source: 'agent-eval-preview',
        });
        if (result.status !== 'completed' || result.maxIterations)
            return { status: 'failed' };
        const verdict = await (0, agent_eval_judge_1.judgeAgentAnswer)({
            agentConfigService: this.agentConfigService,
            credentialsService: this.credentialsService,
            logger: this.logger,
        }, {
            input: draftCase.input,
            output: result.response,
            criteria: draftCase.whatToCheck.trim() || null,
            expectedOutput: null,
        }, { agentId, projectId, user });
        const rule = draftCase.whatToCheck.trim();
        const suggestion = verdict.status === 'completed' && verdict.outcome === 'fail' && rule
            ? await (0, agent_eval_fix_suggestion_1.generateFixSuggestion)({
                agentConfigService: this.agentConfigService,
                credentialsService: this.credentialsService,
                logger: this.logger,
            }, { input: draftCase.input, output: result.response, rule, reasoning: verdict.reasoning }, { agentId, projectId, user })
            : null;
        return {
            status: 'completed',
            input: draftCase.input,
            whatToCheck: draftCase.whatToCheck,
            scenario: draftCase.scenario,
            response: result.response,
            verdict: suggestion ? { ...verdict, suggestion } : verdict,
        };
    }
    assertInstanceWriteAccess() {
        if (this.instanceWriteAccess.isReadOnly()) {
            throw new errors_1.ForbiddenError('Cannot generate eval cases on a protected instance. This instance is in read-only mode.');
        }
    }
    async resolveAgentModel(config, projectId, user) {
        const { model, credential } = config;
        if (!model || !credential || credential === api_types_1.MANAGED_CREDENTIAL_TOKEN) {
            throw new n8n_workflow_1.UserError('This agent needs a configured model and API-key credential before draft cases can be generated.');
        }
        if (!(0, credential_field_mapping_1.isSupportedAgentProvider)((0, agent_config_1.getProviderPrefix)(model))) {
            throw new n8n_workflow_1.UserError(`The agent's model provider is not supported for case generation ("${model}").`);
        }
        const credentialProvider = (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, projectId, user);
        return await (0, model_config_1.resolveCredentialAwareModelConfig)(model, credential, credentialProvider, config.modelDeploymentName);
    }
    async invokeModel(modelConfig, userPrompt, expectedCount) {
        const { Agent } = await import('@n8n/agents');
        const agent = new Agent('agent-eval-case-generation')
            .model(modelConfig)
            .instructions(case_generation_prompt_1.CASE_GENERATION_SYSTEM_PROMPT)
            .structuredOutput(case_generation_prompt_1.generatedCasesSchema);
        const attempt = async (prompt) => {
            const result = await agent.generate(prompt, {
                abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
            });
            const parsed = case_generation_prompt_1.generatedCasesSchema.safeParse(result.structuredOutput);
            if (!parsed.success)
                return null;
            const cases = parsed.data.cases
                .map((c) => ({
                input: c.input.trim(),
                whatToCheck: c.whatToCheck.trim(),
                scenario: c.scenario.trim(),
            }))
                .filter((c) => c.input.length > 0 && c.whatToCheck.length > 0 && c.scenario.length > 0);
            return cases.length >= expectedCount ? cases : null;
        };
        const first = await attempt(userPrompt);
        if (first)
            return first;
        const retry = await attempt(`${userPrompt}\n\nReturn ONLY a JSON object with exactly ${expectedCount} cases matching the required schema — no extra keys, no prose.`);
        if (retry)
            return retry;
        throw new n8n_workflow_1.OperationalError('Case generation returned fewer valid cases than requested after a retry');
    }
    async persistDataset(projectId, agentId, createdById, baseName, cases) {
        const columns = [
            { name: INPUT_COLUMN, type: 'string' },
            { name: CRITERIA_COLUMN, type: 'string' },
        ];
        let table;
        let name = baseName;
        for (let attempt = 0; table === undefined; attempt++) {
            name = attempt === 0 ? baseName : suffixedName(baseName, attempt + 1);
            try {
                table = await this.dataTableService.createDataTable(projectId, { name, columns });
            }
            catch (error) {
                if (error instanceof data_table_name_conflict_error_1.DataTableNameConflictError && attempt < MAX_NAME_ATTEMPTS - 1) {
                    continue;
                }
                throw error;
            }
        }
        try {
            if (cases.length > 0) {
                const rows = cases.map((c) => ({
                    [INPUT_COLUMN]: c.input,
                    [CRITERIA_COLUMN]: c.whatToCheck,
                }));
                await this.dataTableService.insertRows(table.id, projectId, rows);
            }
            const columnMapping = { input: INPUT_COLUMN, criteria: CRITERIA_COLUMN };
            const dataset = await this.datasetRepository.createDataset({
                name,
                agentId,
                datasetSource: 'data_table',
                datasetRef: { dataTableId: table.id },
                columnMapping,
                createdById,
            });
            return { datasetId: dataset.id, dataTableId: table.id, columnMapping };
        }
        catch (error) {
            await this.rollBackDataTable(table.id, projectId);
            throw error;
        }
    }
    async deleteDraftTable(dataTableId, projectId) {
        await this.dataTableService.deleteDataTable(dataTableId, projectId);
    }
    async rollBackDataTable(dataTableId, projectId) {
        try {
            await this.dataTableService.deleteDataTable(dataTableId, projectId);
        }
        catch (cleanupError) {
            this.logger.error('Failed to clean up data table after case-generation failure', {
                dataTableId,
                error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
            });
        }
    }
};
exports.AgentEvalCaseGenerationService = AgentEvalCaseGenerationService;
exports.AgentEvalCaseGenerationService = AgentEvalCaseGenerationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_config_service_1.AgentConfigService, credentials_service_1.CredentialsService, data_table_service_1.DataTableService, db_1.AgentEvalDatasetRepository, agent_evals_flag_gate_1.AgentEvalsFlagGate, backend_services_1.InstanceWriteAccessService, agent_test_run_service_1.AgentTestRunService])
], AgentEvalCaseGenerationService);
function boundCases(cases, limit) {
    return cases.slice(0, limit).map((c) => ({
        input: truncateText(c.input, MAX_CASE_TEXT_CHARS),
        whatToCheck: truncateText(c.whatToCheck, MAX_CASE_TEXT_CHARS),
        scenario: truncateText(c.scenario, MAX_SCENARIO_CHARS),
    }));
}
function truncateText(text, max) {
    return text.length > max ? text.slice(0, max) : text;
}
function toRevisionContext(options) {
    const suggestion = options.suggestion?.trim();
    const previousInput = options.previousInput?.trim();
    if (!suggestion || !previousInput)
        return undefined;
    const previousOutput = options.previousOutput?.trim() ?? '';
    return { suggestion, previousInput, previousOutput };
}
function toExampleContext(options) {
    const input = options.exampleInput?.trim();
    const output = options.exampleOutput?.trim();
    if (!input || !output)
        return undefined;
    return { input, output };
}
function clampCount(count) {
    if (count === undefined || !Number.isFinite(count))
        return DEFAULT_CASE_COUNT;
    return Math.min(Math.max(Math.trunc(count), 1), MAX_CASE_COUNT);
}
function defaultDatasetName(agentName) {
    return truncateName(`Draft cases for ${agentName}`);
}
function suffixedName(baseName, n) {
    const suffix = ` (${n})`;
    return `${truncateName(baseName, 128 - suffix.length)}${suffix}`;
}
function truncateName(name, max = 128) {
    return truncateText(name, max);
}
//# sourceMappingURL=agent-eval-case-generation.service.js.map