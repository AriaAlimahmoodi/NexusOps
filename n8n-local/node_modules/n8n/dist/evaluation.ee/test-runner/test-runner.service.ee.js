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
var TestRunnerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunnerService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = __importDefault(require("node:assert"));
const p_limit_1 = __importDefault(require("p-limit"));
const active_executions_1 = require("../../active-executions");
const concurrency_control_service_1 = require("../../concurrency/concurrency-control.service");
const evaluation_concurrency_helper_1 = require("../../evaluation.ee/evaluation-concurrency.helper");
const errors_ee_1 = require("../../evaluation.ee/test-runner/errors.ee");
const utils_ee_1 = require("../../evaluation.ee/test-runner/utils.ee");
const license_1 = require("../../license");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const ownership_service_1 = require("../../services/ownership.service");
const telemetry_1 = require("../../telemetry");
const workflow_runner_1 = require("../../workflow-runner");
const utils_1 = require("../../workflows/utils");
const workflow_history_service_1 = require("../../workflows/workflow-history/workflow-history.service");
const evaluation_metrics_ee_1 = require("./evaluation-metrics.ee");
const workflow_compiler_service_1 = require("./workflow-compiler.service");
let TestRunnerService = TestRunnerService_1 = class TestRunnerService {
    constructor(logger, telemetry, workflowRepository, workflowRunner, activeExecutions, testRunRepository, testCaseExecutionRepository, errorReporter, executionsConfig, eventService, publisher, instanceSettings, concurrencyControlService, license, workflowHistoryService, evaluationCollectionRepository, evaluationConfigRepository, workflowCompiler, ownershipService) {
        this.logger = logger;
        this.telemetry = telemetry;
        this.workflowRepository = workflowRepository;
        this.workflowRunner = workflowRunner;
        this.activeExecutions = activeExecutions;
        this.testRunRepository = testRunRepository;
        this.testCaseExecutionRepository = testCaseExecutionRepository;
        this.errorReporter = errorReporter;
        this.executionsConfig = executionsConfig;
        this.eventService = eventService;
        this.publisher = publisher;
        this.instanceSettings = instanceSettings;
        this.concurrencyControlService = concurrencyControlService;
        this.license = license;
        this.workflowHistoryService = workflowHistoryService;
        this.evaluationCollectionRepository = evaluationCollectionRepository;
        this.evaluationConfigRepository = evaluationConfigRepository;
        this.workflowCompiler = workflowCompiler;
        this.ownershipService = ownershipService;
        this.abortControllers = new Map();
    }
    findEvaluationTriggerNode(workflow) {
        return workflow.nodes.find((node) => node.type === n8n_workflow_1.EVALUATION_TRIGGER_NODE_TYPE);
    }
    validateEvaluationTriggerNode(workflow) {
        const triggerNode = this.findEvaluationTriggerNode(workflow);
        if (!triggerNode) {
            throw new errors_ee_1.TestRunError(db_1.TestRunErrorCode.EVALUATION_TRIGGER_NOT_FOUND);
        }
        const { parameters, credentials, name, typeVersion } = triggerNode;
        const source = parameters?.source
            ? parameters.source
            : typeVersion >= 4.7
                ? 'dataTable'
                : 'googleSheets';
        const isConfigured = source === 'dataTable'
            ? (0, utils_ee_1.checkNodeParameterNotEmpty)(parameters?.dataTableId)
            : !!credentials &&
                (0, utils_ee_1.checkNodeParameterNotEmpty)(parameters?.documentId) &&
                (0, utils_ee_1.checkNodeParameterNotEmpty)(parameters?.sheetName);
        if (!isConfigured) {
            throw new errors_ee_1.TestRunError(db_1.TestRunErrorCode.EVALUATION_TRIGGER_NOT_CONFIGURED, {
                node_name: name,
            });
        }
        if (triggerNode?.disabled) {
            throw new errors_ee_1.TestRunError(db_1.TestRunErrorCode.EVALUATION_TRIGGER_DISABLED);
        }
    }
    hasModelNodeConnected(workflow, targetNodeName) {
        return Object.keys(workflow.connections).some((sourceNodeName) => {
            const connections = workflow.connections[sourceNodeName];
            return connections?.[n8n_workflow_1.NodeConnectionTypes.AiLanguageModel]?.[0]?.some((connection) => connection.node === targetNodeName);
        });
    }
    validateSetMetricsNodes(workflow) {
        const metricsNodes = TestRunnerService_1.getEvaluationMetricsNodes(workflow);
        if (metricsNodes.length === 0) {
            throw new errors_ee_1.TestRunError(db_1.TestRunErrorCode.SET_METRICS_NODE_NOT_FOUND);
        }
        const unconfiguredMetricsNode = metricsNodes.find((node) => {
            if (node.disabled === true || !node.parameters) {
                return true;
            }
            const isCustomMetricsMode = node.typeVersion >= 4.7 ? node.parameters.metric === 'customMetrics' : true;
            if (isCustomMetricsMode) {
                return (!node.parameters.metrics ||
                    node.parameters.metrics.assignments?.length === 0 ||
                    node.parameters.metrics.assignments?.some((assignment) => !assignment.name || assignment.value === null));
            }
            if (node.typeVersion >= 4.7) {
                const metric = (node.parameters.metric ?? n8n_workflow_1.DEFAULT_EVALUATION_METRIC);
                if ((0, n8n_workflow_1.metricRequiresModelConnection)(metric) &&
                    !this.hasModelNodeConnected(workflow, node.name)) {
                    return true;
                }
            }
            return false;
        });
        if (unconfiguredMetricsNode) {
            throw new errors_ee_1.TestRunError(db_1.TestRunErrorCode.SET_METRICS_NODE_NOT_CONFIGURED, {
                node_name: unconfiguredMetricsNode.name,
            });
        }
    }
    validateSetOutputsNodes(workflow) {
        const setOutputsNodes = TestRunnerService_1.getEvaluationSetOutputsNodes(workflow);
        if (setOutputsNodes.length === 0) {
            return;
        }
        const unconfiguredSetOutputsNode = setOutputsNodes.find((node) => !node.parameters ||
            !node.parameters.outputs ||
            node.parameters.outputs.assignments?.length === 0 ||
            node.parameters.outputs.assignments?.some((assignment) => !assignment.name || assignment.value === null));
        if (unconfiguredSetOutputsNode) {
            throw new errors_ee_1.TestRunError(db_1.TestRunErrorCode.SET_OUTPUTS_NODE_NOT_CONFIGURED, {
                node_name: unconfiguredSetOutputsNode.name,
            });
        }
    }
    validateWorkflowConfiguration(workflow) {
        this.validateEvaluationTriggerNode(workflow);
        this.validateSetOutputsNodes(workflow);
        this.validateSetMetricsNodes(workflow);
    }
    async runTestCase(workflow, metadata, testCase, abortSignal) {
        if (abortSignal.aborted) {
            return;
        }
        const triggerNode = this.findEvaluationTriggerNode(workflow);
        (0, node_assert_1.default)(triggerNode);
        const pinData = {
            [triggerNode.name]: [testCase],
        };
        const data = {
            executionMode: 'evaluation',
            pinData,
            forceFullExecutionData: true,
            workflowData: {
                ...workflow,
                settings: {
                    ...workflow.settings,
                    saveManualExecutions: true,
                    saveDataErrorExecution: 'all',
                    saveDataSuccessExecution: 'all',
                    saveExecutionProgress: false,
                },
            },
            userId: metadata.userId,
            evaluationRunId: metadata.testRunId,
            triggerToStartFrom: {
                name: triggerNode.name,
            },
        };
        if (this.executionsConfig.mode === 'queue') {
            data.executionData = (0, n8n_workflow_1.createRunExecutionData)({
                executionData: null,
                resultData: {
                    pinData,
                },
                manualData: {
                    userId: metadata.userId,
                    evaluationRunId: metadata.testRunId,
                    triggerToStartFrom: {
                        name: triggerNode.name,
                    },
                },
            });
        }
        const executionId = await this.workflowRunner.run(data);
        (0, node_assert_1.default)(executionId);
        const { projectId, projectName } = await (0, utils_1.getWorkflowProjectDetailsSafe)(this.ownershipService, workflow.id);
        this.eventService.emit('workflow-executed', {
            user: metadata.userId ? { id: metadata.userId } : undefined,
            workflowId: workflow.id,
            workflowName: workflow.name,
            executionId,
            projectId,
            projectName,
            source: 'evaluation',
        });
        abortSignal.addEventListener('abort', () => {
            this.activeExecutions.stopExecution(executionId, new n8n_workflow_1.ManualExecutionCancelledError(executionId));
        });
        const executionData = await this.activeExecutions.getPostExecutePromise(executionId);
        (0, node_assert_1.default)(executionData);
        return { executionId, executionData };
    }
    async runDatasetTrigger(workflow, metadata) {
        const triggerNode = this.findEvaluationTriggerNode(workflow);
        if (!triggerNode) {
            throw new errors_ee_1.TestRunError(db_1.TestRunErrorCode.EVALUATION_TRIGGER_NOT_FOUND);
        }
        triggerNode.forceCustomOperation = {
            resource: 'dataset',
            operation: 'getRows',
        };
        const data = {
            destinationNode: { nodeName: triggerNode.name, mode: 'inclusive' },
            executionMode: 'manual',
            runData: {},
            forceFullExecutionData: true,
            workflowData: {
                ...workflow,
                settings: {
                    ...workflow.settings,
                    saveManualExecutions: false,
                    saveDataErrorExecution: 'none',
                    saveDataSuccessExecution: 'none',
                    saveExecutionProgress: false,
                },
            },
            userId: metadata.userId,
            executionData: (0, n8n_workflow_1.createRunExecutionData)({
                startData: {
                    destinationNode: { nodeName: triggerNode.name, mode: 'inclusive' },
                },
                manualData: {
                    userId: metadata.userId,
                    triggerToStartFrom: {
                        name: triggerNode.name,
                    },
                },
                executionData: {
                    nodeExecutionStack: [
                        { node: triggerNode, data: { main: [[{ json: {} }]] }, source: null },
                    ],
                },
            }),
            triggerToStartFrom: {
                name: triggerNode.name,
            },
        };
        const offloadingManualExecutionsInQueueMode = this.executionsConfig.mode === 'queue' &&
            process.env.OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS === 'true';
        if (offloadingManualExecutionsInQueueMode) {
            delete data.executionData.executionData;
        }
        const executionId = await this.workflowRunner.run(data);
        (0, node_assert_1.default)(executionId);
        const executePromise = this.activeExecutions.getPostExecutePromise(executionId);
        return await executePromise;
    }
    static getEvaluationNodes(workflow, operation, { isDefaultOperation } = { isDefaultOperation: false }) {
        return workflow.nodes.filter((node) => node.type === n8n_workflow_1.EVALUATION_NODE_TYPE &&
            node.disabled !== true &&
            (node.parameters.operation === operation ||
                (isDefaultOperation && node.parameters.operation === undefined)));
    }
    static getEvaluationMetricsNodes(workflow) {
        return this.getEvaluationNodes(workflow, 'setMetrics');
    }
    static getEvaluationSetOutputsNodes(workflow) {
        return this.getEvaluationNodes(workflow, 'setOutputs', { isDefaultOperation: true });
    }
    extractDatasetTriggerOutput(execution, workflow) {
        const triggerNode = this.findEvaluationTriggerNode(workflow);
        (0, node_assert_1.default)(triggerNode);
        const triggerOutputData = execution.data.resultData.runData[triggerNode.name]?.[0];
        if (!triggerOutputData || triggerOutputData.error) {
            throw new errors_ee_1.TestRunError(db_1.TestRunErrorCode.CANT_FETCH_TEST_CASES, {
                message: triggerOutputData?.error?.message ?? 'Evaluation trigger node did not produce any output',
            });
        }
        const triggerOutput = triggerOutputData.data?.[n8n_workflow_1.NodeConnectionTypes.Main]?.[0];
        if (!triggerOutput || triggerOutput.length === 0) {
            throw new errors_ee_1.TestRunError(db_1.TestRunErrorCode.TEST_CASES_NOT_FOUND);
        }
        return triggerOutput;
    }
    getEvaluationData(execution, workflow, operation) {
        const evalNodes = TestRunnerService_1.getEvaluationNodes(workflow, operation);
        return evalNodes.reduce((accu, node) => {
            const runs = execution.data.resultData.runData[node.name];
            const data = runs?.[0]?.data?.[n8n_workflow_1.NodeConnectionTypes.Main]?.[0]?.[0]?.evaluationData ?? {};
            Object.assign(accu, data);
            return accu;
        }, {});
    }
    resolveCaseInputs(execution, workflow, testCase, startNodeName) {
        const inputs = this.getEvaluationData(execution, workflow, 'setInputs');
        if (Object.keys(inputs).length > 0 || !startNodeName)
            return inputs;
        return this.datasetRowToJsonObject(testCase);
    }
    datasetRowToJsonObject(testCase) {
        return this.toJsonObject(testCase.json);
    }
    toJsonObject(value) {
        const out = {};
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(out, value);
        }
        return out;
    }
    resolveCaseOutputs(execution, workflow, endNodeName) {
        const outputs = this.getEvaluationData(execution, workflow, 'setOutputs');
        if (Object.keys(outputs).length > 0 || !endNodeName)
            return outputs;
        return this.getEndNodeOutputs(execution, endNodeName);
    }
    getEndNodeOutputs(execution, endNodeName) {
        const mainBuckets = execution.data.resultData.runData[endNodeName]?.[0]?.data?.[n8n_workflow_1.NodeConnectionTypes.Main] ?? [];
        const json = mainBuckets.find((bucket) => bucket?.[0]?.json !== undefined)?.[0]?.json;
        return this.toJsonObject(json);
    }
    extractUserDefinedMetrics(execution, workflow) {
        const metricsNodes = TestRunnerService_1.getEvaluationMetricsNodes(workflow);
        const metricsRunData = metricsNodes
            .flatMap((node) => execution.data.resultData.runData[node.name])
            .filter((data) => data !== undefined);
        const metricsData = metricsRunData
            .reverse()
            .map((data) => data.data?.main?.[0]?.[0]?.json ?? {});
        const metricsResult = metricsData.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        return metricsResult;
    }
    extractPredefinedMetrics(execution) {
        const metricValues = {};
        const tokenUsageMetrics = (0, utils_ee_1.extractTokenUsage)(execution.data.resultData.runData);
        Object.assign(metricValues, tokenUsageMetrics.total);
        if (execution.startedAt && execution.stoppedAt) {
            metricValues.executionTime = execution.stoppedAt.getTime() - execution.startedAt.getTime();
        }
        return metricValues;
    }
    async runTest(user, workflowId, concurrency = 1) {
        const { finished } = await this.startTestRun(user, workflowId, concurrency);
        await finished;
    }
    async startTestRun(user, workflowId, concurrency = 1, options) {
        const requestedConcurrency = Math.max(1, Math.min(10, Math.floor(concurrency)));
        const evaluationLimit = (0, evaluation_concurrency_helper_1.resolveEvaluationConcurrencyLimit)(this.executionsConfig, this.license);
        const concurrencyLimitedByConfig = evaluationLimit > 0 && requestedConcurrency > evaluationLimit;
        const effectiveConcurrency = concurrencyLimitedByConfig
            ? evaluationLimit
            : requestedConcurrency;
        this.logger.debug(`[Eval] runTest called: requestedConcurrency=${requestedConcurrency} effectiveConcurrency=${effectiveConcurrency} evaluationLimit=${evaluationLimit}`, {
            workflowId,
            collectionId: options?.collectionId,
            workflowVersionId: options?.workflowVersionId,
        });
        const baseWorkflow = await this.workflowRepository.findById(workflowId);
        (0, node_assert_1.default)(baseWorkflow, 'Workflow not found');
        let workflow = baseWorkflow;
        if (options?.workflowVersionId) {
            const history = await this.workflowHistoryService.findVersion(workflowId, options.workflowVersionId);
            (0, node_assert_1.default)(history, `Workflow version ${options.workflowVersionId} not found`);
            workflow = {
                ...baseWorkflow,
                versionId: history.versionId,
                nodes: history.nodes,
                connections: history.connections,
            };
        }
        let evaluationConfigSnapshot = options?.evaluationConfigSnapshot ?? null;
        let configToCompile;
        let configLookupErrorCode;
        if (options?.compileFromConfig) {
            if (options.evaluationConfigSnapshot) {
                configToCompile = options.evaluationConfigSnapshot;
            }
            else if (options.evaluationConfigId) {
                const config = await this.evaluationConfigRepository.findByIdAndWorkflowId(options.evaluationConfigId, workflowId);
                if (!config) {
                    configLookupErrorCode = db_1.TestRunErrorCode.EVALUATION_CONFIG_NOT_FOUND;
                }
                else {
                    configToCompile = config;
                    evaluationConfigSnapshot = config;
                }
            }
        }
        const testRun = await this.testRunRepository.createTestRun(workflowId, {
            collectionId: options?.collectionId ?? null,
            workflowVersionId: options?.workflowVersionId ?? null,
            evaluationConfigId: options?.evaluationConfigId ?? null,
            evaluationConfigSnapshot,
        });
        (0, node_assert_1.default)(testRun, 'Unable to create a test run');
        if (configLookupErrorCode) {
            await this.testRunRepository.markAsError(testRun.id, configLookupErrorCode, {
                evaluationConfigId: options?.evaluationConfigId,
            });
            return { testRun, finished: Promise.resolve() };
        }
        const runType = configToCompile ? 'config' : 'direct';
        let startNodeName;
        let endNodeName;
        if (configToCompile) {
            startNodeName = configToCompile.startNodeName;
            endNodeName = configToCompile.endNodeName;
            try {
                workflow = this.workflowCompiler.compile(workflow, configToCompile);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                await this.testRunRepository.markAsError(testRun.id, db_1.TestRunErrorCode.COMPILATION_FAILED, {
                    evaluationConfigId: options?.evaluationConfigId,
                    reason: message,
                });
                return { testRun, finished: Promise.resolve() };
            }
        }
        const finished = this.executeTestRun({
            user,
            workflowId,
            workflow,
            testRun,
            effectiveConcurrency,
            concurrencyLimitedByConfig,
            runType,
            via: options?.via,
            rowIndices: options?.rowIndices,
            startNodeName,
            endNodeName,
        });
        return { testRun, finished };
    }
    async executeTestRun({ user, workflowId, workflow, testRun, effectiveConcurrency, concurrencyLimitedByConfig, runType, via = 'ui', rowIndices, startNodeName, endNodeName, }) {
        const telemetryMeta = {
            workflow_id: workflowId,
            test_type: 'evaluation',
            run_id: testRun.id,
            run_type: runType,
            via,
            start: Date.now(),
            status: 'success',
            test_case_count: 0,
            errored_test_case_count: 0,
            metric_count: 0,
            error_message: '',
            duration: 0,
            concurrency: effectiveConcurrency,
            parallel_enabled: effectiveConcurrency > 1,
            concurrency_limited_by_config: concurrencyLimitedByConfig,
            concurrency_limit_source: (0, evaluation_concurrency_helper_1.getEvaluationConcurrencyLimitSource)(this.license),
            cases_started: 0,
            peak_in_flight: 0,
        };
        const abortController = new AbortController();
        this.abortControllers.set(testRun.id, abortController);
        const testRunMetadata = {
            testRunId: testRun.id,
            userId: user.id,
        };
        const abortSignal = abortController.signal;
        const { manager: dbManager } = this.testRunRepository;
        try {
            await this.testRunRepository.markAsRunning(testRun.id, this.instanceSettings.hostId);
            this.validateWorkflowConfiguration(workflow);
            this.telemetry.track('User ran test', {
                user_id: user.id,
                run_id: testRun.id,
                workflow_id: workflowId,
                run_type: runType,
                via,
            });
            const datasetFetchExecution = await this.runDatasetTrigger(workflow, testRunMetadata);
            (0, node_assert_1.default)(datasetFetchExecution);
            const datasetTriggerOutput = this.extractDatasetTriggerOutput(datasetFetchExecution, workflow);
            const allTestCases = datasetTriggerOutput.map((items) => ({ json: items.json }));
            const indicesToRun = rowIndices && rowIndices.length > 0
                ? rowIndices.filter((i) => i >= 0 && i < allTestCases.length)
                : allTestCases.map((_, i) => i);
            const testCases = indicesToRun.map((i) => allTestCases[i]);
            telemetryMeta.test_case_count = testCases.length;
            this.logger.debug('Found test cases', {
                total: allTestCases.length,
                running: testCases.length,
            });
            const seededCases = await this.testCaseExecutionRepository.createPendingBatch(testRun.id, indicesToRun.map((datasetIndex, position) => ({
                runIndex: datasetIndex,
                inputs: this.datasetRowToJsonObject(testCases[position]),
            })));
            const metrics = new evaluation_metrics_ee_1.EvaluationMetrics();
            const limit = (0, p_limit_1.default)(effectiveConcurrency);
            const fanOutMetrics = { inFlight: 0, peakInFlight: 0, casesStarted: 0 };
            this.logger.debug(`[Eval] Fan-out begin: cases=${testCases.length} concurrency=${effectiveConcurrency}`, { testRunId: testRun.id, workflowId });
            const contributionResults = await Promise.all(testCases.map(async (testCase, caseIndex) => await limit(async () => {
                if (abortSignal.aborted) {
                    return [];
                }
                const seededCase = seededCases[caseIndex];
                const claimed = await this.testCaseExecutionRepository.tryMarkCaseAsRunning(seededCase.id);
                if (!claimed) {
                    this.logger.debug('Test case skipped (cancelled before start)', {
                        testRunId: testRun.id,
                        caseId: seededCase.id,
                    });
                    return [];
                }
                if (this.instanceSettings.isMultiMain &&
                    (await this.testRunRepository.isCancellationRequested(testRun.id))) {
                    this.logger.debug('Test run cancellation requested via database flag', {
                        workflowId,
                        testRunId: testRun.id,
                    });
                    abortController.abort();
                    return [];
                }
                const caseTrackingId = `${testRun.id}-case-${caseIndex}`;
                let abortHandler;
                let throttleAcquired = false;
                const abortRace = new Promise((resolve) => {
                    abortHandler = () => resolve('aborted');
                    abortSignal.addEventListener('abort', abortHandler, { once: true });
                });
                const acquireRace = this.concurrencyControlService
                    .throttle({ mode: 'evaluation', executionId: caseTrackingId })
                    .then(() => {
                    throttleAcquired = true;
                    return 'acquired';
                });
                const acquired = await Promise.race([acquireRace, abortRace]);
                if (acquired === 'aborted') {
                    if (throttleAcquired) {
                        this.concurrencyControlService.release({ mode: 'evaluation' });
                    }
                    else {
                        this.concurrencyControlService.remove({
                            mode: 'evaluation',
                            executionId: caseTrackingId,
                        });
                    }
                    return [];
                }
                if (abortHandler) {
                    abortSignal.removeEventListener('abort', abortHandler);
                }
                if (abortSignal.aborted) {
                    this.concurrencyControlService.release({ mode: 'evaluation' });
                    return [];
                }
                fanOutMetrics.inFlight += 1;
                fanOutMetrics.casesStarted += 1;
                telemetryMeta.cases_started = fanOutMetrics.casesStarted;
                if (fanOutMetrics.inFlight > fanOutMetrics.peakInFlight) {
                    fanOutMetrics.peakInFlight = fanOutMetrics.inFlight;
                    telemetryMeta.peak_in_flight = fanOutMetrics.peakInFlight;
                }
                this.logger.debug(`[Eval] Case started: case=${caseIndex} inFlight=${fanOutMetrics.inFlight}/${effectiveConcurrency} peak=${fanOutMetrics.peakInFlight}`, { testRunId: testRun.id });
                const runAt = new Date();
                try {
                    let testCaseExecutionId;
                    try {
                        const testCaseMetadata = { ...testRunMetadata };
                        const testCaseResult = await this.runTestCase(workflow, testCaseMetadata, testCase, abortSignal);
                        if (!testCaseResult) {
                            (0, node_assert_1.default)(abortSignal.aborted, 'runTestCase returned undefined without abort being set');
                            return [];
                        }
                        const { executionData: testCaseExecution } = testCaseResult;
                        testCaseExecutionId = testCaseResult.executionId;
                        (0, node_assert_1.default)(testCaseExecution);
                        (0, node_assert_1.default)(testCaseExecutionId);
                        this.logger.debug('Test case execution finished');
                        if (!testCaseExecution || testCaseExecution.data.resultData.error) {
                            await this.testCaseExecutionRepository.update(seededCase.id, {
                                executionId: testCaseExecutionId,
                                status: 'error',
                                errorCode: db_1.TestCaseExecutionErrorCode.FAILED_TO_EXECUTE_WORKFLOW,
                                metrics: {},
                                completedAt: new Date(),
                            });
                            telemetryMeta.errored_test_case_count++;
                            return [];
                        }
                        const completedAt = new Date();
                        const predefinedContribution = evaluation_metrics_ee_1.EvaluationMetrics.buildContribution(this.extractPredefinedMetrics(testCaseExecution));
                        this.logger.debug('Test case common metrics extracted', predefinedContribution.addedMetrics);
                        const userDefinedContribution = evaluation_metrics_ee_1.EvaluationMetrics.buildContribution(this.extractUserDefinedMetrics(testCaseExecution, workflow));
                        if (Object.keys(userDefinedContribution.addedMetrics).length === 0) {
                            await this.testCaseExecutionRepository.update(seededCase.id, {
                                executionId: testCaseExecutionId,
                                runAt,
                                completedAt,
                                status: 'error',
                                errorCode: db_1.TestCaseExecutionErrorCode.NO_METRICS_COLLECTED,
                            });
                            telemetryMeta.errored_test_case_count++;
                            return [predefinedContribution];
                        }
                        const combinedMetrics = {
                            ...userDefinedContribution.addedMetrics,
                            ...predefinedContribution.addedMetrics,
                        };
                        const inputs = this.resolveCaseInputs(testCaseExecution, workflow, testCase, startNodeName);
                        const outputs = this.resolveCaseOutputs(testCaseExecution, workflow, endNodeName);
                        this.logger.debug('Test case metrics extracted (user-defined)', userDefinedContribution.addedMetrics);
                        await this.testCaseExecutionRepository.update(seededCase.id, {
                            executionId: testCaseExecutionId,
                            runAt,
                            completedAt,
                            status: 'success',
                            metrics: combinedMetrics,
                            inputs,
                            outputs,
                        });
                        return [predefinedContribution, userDefinedContribution];
                    }
                    catch (e) {
                        const completedAt = new Date();
                        this.logger.error('[Eval] Test case execution failed', {
                            workflowId,
                            testRunId: testRun.id,
                            caseIndex,
                            errorName: e instanceof Error ? e.name : 'Unknown',
                            errorMessage: e instanceof Error ? e.message : String(e),
                            errorStack: e instanceof Error ? e.stack : undefined,
                        });
                        telemetryMeta.errored_test_case_count++;
                        if (e instanceof errors_ee_1.TestCaseExecutionError) {
                            await this.testCaseExecutionRepository.update(seededCase.id, {
                                executionId: testCaseExecutionId,
                                runAt,
                                completedAt,
                                status: 'error',
                                errorCode: e.code,
                                errorDetails: e.extra,
                            });
                        }
                        else {
                            await this.testCaseExecutionRepository.update(seededCase.id, {
                                executionId: testCaseExecutionId,
                                runAt,
                                completedAt,
                                status: 'error',
                                errorCode: db_1.TestCaseExecutionErrorCode.UNKNOWN_ERROR,
                            });
                            this.errorReporter.error(e);
                        }
                        return [];
                    }
                }
                finally {
                    this.concurrencyControlService.release({ mode: 'evaluation' });
                    fanOutMetrics.inFlight -= 1;
                    this.logger.debug(`[Eval] Case finished: case=${caseIndex} inFlight=${fanOutMetrics.inFlight}/${effectiveConcurrency}`, { testRunId: testRun.id });
                }
            })));
            this.logger.debug(`[Eval] Fan-out complete: cases=${fanOutMetrics.casesStarted} peakInFlight=${fanOutMetrics.peakInFlight}/${effectiveConcurrency}`, { testRunId: testRun.id });
            for (const caseContributions of contributionResults) {
                for (const contribution of caseContributions) {
                    metrics.mergeContribution(contribution);
                }
            }
            if (abortSignal.aborted) {
                this.logger.debug('Test run was cancelled', { workflowId });
                await dbManager.transaction(async (trx) => {
                    await this.testRunRepository.markAsCancelled(testRun.id, trx);
                    await this.testCaseExecutionRepository.markAllPendingAsCancelled(testRun.id, trx);
                });
                telemetryMeta.status = 'cancelled';
            }
            else {
                const aggregatedMetrics = metrics.getAggregatedMetrics();
                telemetryMeta.metric_count = Object.keys(aggregatedMetrics).length;
                this.logger.debug('Aggregated metrics', aggregatedMetrics);
                await this.testRunRepository.markAsCompleted(testRun.id, aggregatedMetrics);
                if (testRun.collectionId) {
                    try {
                        await this.evaluationCollectionRepository.updateInsightsCache(testRun.collectionId, null);
                    }
                    catch (cacheError) {
                        this.logger.warn('Failed to bust eval-collection insights cache', {
                            testRunId: testRun.id,
                            collectionId: testRun.collectionId,
                            error: cacheError instanceof Error ? cacheError.message : String(cacheError),
                        });
                    }
                }
                this.logger.debug('Test run finished', { workflowId, testRunId: testRun.id });
            }
        }
        catch (e) {
            telemetryMeta.status = 'fail';
            if (e instanceof n8n_workflow_1.ExecutionCancelledError) {
                this.logger.debug('Evaluation execution was cancelled. Cancelling test run', {
                    testRunId: testRun.id,
                    stoppedOn: e.extra?.executionId,
                });
                await dbManager.transaction(async (trx) => {
                    await this.testRunRepository.markAsCancelled(testRun.id, trx);
                    await this.testCaseExecutionRepository.markAllPendingAsCancelled(testRun.id, trx);
                });
                telemetryMeta.status = 'cancelled';
            }
            else if (e instanceof errors_ee_1.TestRunError) {
                await this.testRunRepository.markAsError(testRun.id, e.code, e.extra);
                telemetryMeta.error_message = e.code;
                if (e.extra && typeof e.extra === 'object' && 'message' in e.extra) {
                    telemetryMeta.error_message += `: ${String(e.extra.message)}`;
                }
            }
            else {
                await this.testRunRepository.markAsError(testRun.id, db_1.TestRunErrorCode.UNKNOWN_ERROR);
                telemetryMeta.error_message = e instanceof Error ? e.message : 'UNKNOWN_ERROR';
                throw e;
            }
        }
        finally {
            telemetryMeta.duration = Date.now() - telemetryMeta.start;
            this.abortControllers.delete(testRun.id);
            await this.testRunRepository.clearInstanceTracking(testRun.id);
            const telemetryPayload = {
                ...telemetryMeta,
                collection_id: testRun.collectionId ?? null,
                is_part_of_collection: testRun.collectionId !== null,
            };
            if (telemetryMeta.status === 'success') {
                telemetryPayload.test_case_count = telemetryMeta.test_case_count;
                telemetryPayload.errored_test_case_count = telemetryMeta.errored_test_case_count;
                telemetryPayload.metric_count = telemetryMeta.metric_count;
            }
            if (telemetryMeta.status === 'fail') {
                telemetryPayload.error_message = telemetryMeta.error_message;
            }
            this.telemetry.track('Test run finished', telemetryPayload);
        }
    }
    canBeCancelled(testRun) {
        return testRun.status !== 'running' && testRun.status !== 'new';
    }
    cancelTestRunLocally(testRunId) {
        const abortController = this.abortControllers.get(testRunId);
        if (abortController) {
            this.logger.debug('Cancelling test run locally', { testRunId });
            abortController.abort();
            this.abortControllers.delete(testRunId);
            return true;
        }
        return false;
    }
    handleCancelTestRunCommand({ testRunId }) {
        this.logger.debug('Received cancel-test-run command via pub/sub', { testRunId });
        this.cancelTestRunLocally(testRunId);
    }
    async handleCancelCollectionCommand({ collectionId }) {
        this.logger.debug('Received cancel-collection command via pub/sub', { collectionId });
        await this.cancelCollectionLocally(collectionId);
    }
    async cancelCollectionLocally(collectionId) {
        const runs = await this.testRunRepository.find({
            where: [
                { collectionId, status: 'running' },
                { collectionId, status: 'new' },
            ],
            select: ['id'],
        });
        const cancelledLocally = [];
        for (const { id } of runs) {
            if (this.cancelTestRunLocally(id))
                cancelledLocally.push(id);
        }
        return cancelledLocally;
    }
    async cancelCollection(collectionId) {
        const activeRuns = await this.testRunRepository.find({
            where: [
                { collectionId, status: 'running' },
                { collectionId, status: 'new' },
            ],
            select: ['id'],
        });
        for (const { id } of activeRuns) {
            await this.testRunRepository.requestCancellation(id);
        }
        const cancelledLocally = await this.cancelCollectionLocally(collectionId);
        if (this.instanceSettings.isMultiMain || this.executionsConfig.mode === 'queue') {
            this.logger.debug('Broadcasting cancel-collection command via pub/sub', { collectionId });
            await this.publisher.publishCommand({
                command: 'cancel-collection',
                payload: { collectionId },
            });
        }
        const localSet = new Set(cancelledLocally);
        const fallbackRunIds = activeRuns.map((r) => r.id).filter((id) => !localSet.has(id));
        if (fallbackRunIds.length > 0) {
            const { manager: dbManager } = this.testRunRepository;
            await dbManager.transaction(async (trx) => {
                for (const runId of fallbackRunIds) {
                    const result = await trx.update(db_1.TestRun, { id: runId, status: (0, typeorm_1.In)(['new', 'running']) }, { status: 'cancelled', completedAt: new Date() });
                    if (result.affected) {
                        await this.testCaseExecutionRepository.markAllPendingAsCancelled(runId, trx);
                    }
                }
            });
        }
        return { cancelledRunIds: activeRuns.map((r) => r.id) };
    }
    async cancelTestRun(testRunId) {
        await this.testRunRepository.requestCancellation(testRunId);
        const cancelledLocally = this.cancelTestRunLocally(testRunId);
        if (this.instanceSettings.isMultiMain || this.executionsConfig.mode === 'queue') {
            this.logger.debug('Broadcasting cancel-test-run command via pub/sub', { testRunId });
            await this.publisher.publishCommand({
                command: 'cancel-test-run',
                payload: { testRunId },
            });
        }
        if (!cancelledLocally) {
            const { manager: dbManager } = this.testRunRepository;
            await dbManager.transaction(async (trx) => {
                const result = await trx.update(db_1.TestRun, { id: testRunId, status: (0, typeorm_1.In)(['new', 'running']) }, { status: 'cancelled', completedAt: new Date() });
                if (result.affected) {
                    await this.testCaseExecutionRepository.markAllPendingAsCancelled(testRunId, trx);
                }
            });
        }
    }
};
exports.TestRunnerService = TestRunnerService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('cancel-test-run', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestRunnerService.prototype, "handleCancelTestRunCommand", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('cancel-collection', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestRunnerService.prototype, "handleCancelCollectionCommand", null);
exports.TestRunnerService = TestRunnerService = TestRunnerService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, telemetry_1.Telemetry, db_1.WorkflowRepository, workflow_runner_1.WorkflowRunner, active_executions_1.ActiveExecutions, db_1.TestRunRepository, db_1.TestCaseExecutionRepository, n8n_core_1.ErrorReporter, config_1.ExecutionsConfig, backend_services_1.EventService, publisher_service_1.Publisher, n8n_core_1.InstanceSettings, concurrency_control_service_1.ConcurrencyControlService, license_1.License, workflow_history_service_1.WorkflowHistoryService, db_1.EvaluationCollectionRepository, db_1.EvaluationConfigRepository, workflow_compiler_service_1.WorkflowCompilerService, ownership_service_1.OwnershipService])
], TestRunnerService);
//# sourceMappingURL=test-runner.service.ee.js.map