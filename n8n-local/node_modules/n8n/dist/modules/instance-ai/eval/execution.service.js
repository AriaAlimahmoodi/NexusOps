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
exports.EvalExecutionService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const proxy_1 = require("@n8n/backend-network/proxy");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const sleep_1 = require("@n8n/utils/sleep");
const workflow_sdk_1 = require("@n8n/workflow-sdk");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const active_executions_1 = require("../../../active-executions");
const load_nodes_and_credentials_1 = require("../../../load-nodes-and-credentials");
const data_table_service_1 = require("../../../modules/data-table/data-table.service");
const node_types_1 = require("../../../node-types");
const posthog_1 = require("../../../posthog");
const ownership_service_1 = require("../../../services/ownership.service");
const workflow_execute_additional_data_1 = require("../../../workflow-execute-additional-data");
const workflow_runner_1 = require("../../../workflow-runner");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const workflow_static_data_service_1 = require("../../../workflows/workflow-static-data.service");
const agent_execution_service_1 = require("./agent-execution.service");
const llm_completion_mock_1 = require("./llm-completion-mock");
const eval_mocked_credentials_helper_1 = require("./eval-mocked-credentials-helper");
const mcp_mock_fetch_1 = require("./mcp-mock-fetch");
const web_search_mock_1 = require("./web-search-mock");
const eval_timings_1 = require("./eval-timings");
const ledger_snapshot_1 = require("./ledger-snapshot");
const llm_wire_server_1 = require("./llm-wire-server");
const mock_handler_1 = require("./mock-handler");
const openai_responses_envelope_1 = require("./openai-responses-envelope");
const data_table_pin_filter_1 = require("./data-table-pin-filter");
const pin_data_generator_1 = require("./pin-data-generator");
const workflow_analysis_1 = require("./workflow-analysis");
const MAX_OUTPUT_ITEMS_PER_BRANCH = 10;
function dataTableLocator(node) {
    const locator = node.parameters?.dataTableId;
    const value = typeof locator === 'string' ? locator : locator?.value;
    if (typeof value !== 'string' || value.length === 0)
        return undefined;
    const byName = typeof locator !== 'string' && locator?.mode === 'name';
    return { mode: byName ? 'name' : 'id', value };
}
let EvalExecutionService = class EvalExecutionService {
    constructor(workflowFinderService, nodeTypes, logger, postHogClient, workflowRunner, activeExecutions, executionsConfig, binaryDataService, workflowStaticDataService, loadNodesAndCredentials, ownershipService, dataTableService, processedDataRepository, instanceAiConfig, moduleRegistry) {
        this.workflowFinderService = workflowFinderService;
        this.nodeTypes = nodeTypes;
        this.logger = logger;
        this.postHogClient = postHogClient;
        this.workflowRunner = workflowRunner;
        this.activeExecutions = activeExecutions;
        this.executionsConfig = executionsConfig;
        this.binaryDataService = binaryDataService;
        this.workflowStaticDataService = workflowStaticDataService;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.ownershipService = ownershipService;
        this.dataTableService = dataTableService;
        this.processedDataRepository = processedDataRepository;
        this.instanceAiConfig = instanceAiConfig;
        this.moduleRegistry = moduleRegistry;
    }
    async executeWithLlmMock(workflowId, user, options = {}) {
        const budget = options.timeoutMs === undefined
            ? undefined
            : { totalMs: options.timeoutMs, deadlineAt: Date.now() + options.timeoutMs };
        if (this.executionsConfig.mode === 'queue') {
            return this.errorResult((0, node_crypto_1.randomUUID)(), 'Eval execution requires main process mode — queue mode is not supported.');
        }
        let workflowEntity = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
            'workflow:execute',
        ]);
        if (!workflowEntity) {
            for (const delayMs of [200, 500, 1000]) {
                await (0, sleep_1.sleep)(delayMs);
                workflowEntity = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
                    'workflow:execute',
                ]);
                if (workflowEntity)
                    break;
            }
        }
        if (!workflowEntity) {
            return this.errorResult((0, node_crypto_1.randomUUID)(), `Workflow ${workflowId} not found or not accessible`);
        }
        let partitioned;
        try {
            partitioned = (0, workflow_analysis_1.partitionAiRoots)(workflowEntity, options.pinNodes ?? []);
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.UserError) {
                return this.errorResult((0, node_crypto_1.randomUUID)(), error.message);
            }
            throw error;
        }
        for (const entry of partitioned.autoPinned) {
            this.logger.debug(`[EvalMock] Auto-pinning AI root "${entry.root}" — sub-node "${entry.subNode}" (${entry.subNodeType}) is ${entry.reason}`);
        }
        let interceptionEnabled = false;
        let unpinNodes = partitioned.unpinNodes;
        if (unpinNodes.length > 0) {
            interceptionEnabled = await this.isInterceptionEnabled(user);
            if (!interceptionEnabled) {
                this.logger.warn('[EvalMock] Vendor SDK interception disabled by kill-switch — pinning all AI roots');
                unpinNodes = [];
            }
        }
        const unpinSet = unpinNodes.length > 0 ? new Set(unpinNodes) : undefined;
        const timings = new eval_timings_1.EvalTimings();
        let hints;
        try {
            hints = await this.analyzeWorkflow(workflowEntity, timings, options.scenarioHints, unpinSet, options.seededDataTableIds);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return this.errorResult((0, node_crypto_1.randomUUID)(), message.startsWith('FRAMEWORK ISSUE:') ? message : `FRAMEWORK ISSUE: ${message}`);
        }
        const vendorLlmRouting = interceptionEnabled
            ? (0, workflow_analysis_1.buildVendorLlmRouting)(workflowEntity, unpinNodes)
            : undefined;
        return await this.execute(workflowEntity, user, hints, timings, options.scenarioHints, interceptionEnabled, vendorLlmRouting, budget);
    }
    async isInterceptionEnabled(user) {
        try {
            const flags = await this.postHogClient.getFeatureFlags(user);
            return flags?.[api_types_1.EVAL_VENDOR_SDK_INTERCEPTION_FLAG] !== false;
        }
        catch (error) {
            this.logger.warn('[EvalMock] Failed to resolve vendor-SDK interception flag', {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    async analyzeWorkflow(workflowEntity, timings, scenarioHints, unpinSet, seededDataTableIds) {
        const hintNodes = (0, workflow_analysis_1.identifyNodesForHints)(workflowEntity);
        const nodeNames = hintNodes.map((n) => n.name);
        this.logger.debug(`[EvalMock] Generating hints for ${nodeNames.length} nodes: ${nodeNames.join(', ')}`);
        const hints = await timings.time('hints', undefined, async () => await (0, workflow_analysis_1.generateMockHints)({
            workflow: workflowEntity,
            nodeNames,
            scenarioHints,
            defaultStartNodeName: this.findStartNode(this.buildWorkflow(workflowEntity))?.name,
        }));
        const triggerStart = this.triggerStartNode(workflowEntity, hints);
        if (triggerStart &&
            triggerStart.type !== n8n_workflow_1.MANUAL_TRIGGER_NODE_TYPE &&
            lacksTriggerContent(hints)) {
            throw new Error(`FRAMEWORK ISSUE: Phase 1 produced no trigger content for start node "${triggerStart.name}" (${hints.warnings.join('; ') || 'no details'}); the scenario cannot run without a trigger event`);
        }
        if (!hints.globalContext && nodeNames.length > 0) {
            this.logger.warn('[EvalMock] Phase 1 hint generation returned empty — mock responses will lack cross-node consistency');
        }
        this.logger.debug(`[EvalMock] Phase 1 result — globalContext: ${hints.globalContext ? 'present' : 'EMPTY'}, triggerContent keys: ${JSON.stringify(Object.keys(hints.triggerContent))}, nodeHints: ${Object.keys(hints.nodeHints).join(', ')}`);
        const liveReads = await this.liveDataTableReads(workflowEntity, seededDataTableIds);
        if (liveReads.size > 0) {
            this.logger.debug(`[EvalMock] Reading seeded Data Tables live: ${[...liveReads].join(', ')}`);
        }
        const bypassNodes = (0, workflow_analysis_1.identifyNodesForPinData)(workflowEntity, unpinSet, liveReads);
        const bypassNodeNames = bypassNodes.map((n) => n.name);
        if (bypassNodeNames.length > 0) {
            this.logger.debug(`[EvalMock] Generating pin data for ${bypassNodeNames.length} bypass nodes: ${bypassNodeNames.join(', ')}`);
            hints.bypassPinData = await this.generateBypassPinData(workflowEntity, bypassNodeNames, hints.globalContext, timings, hints.warnings, scenarioHints);
            this.logger.debug(`[EvalMock] Phase 1.5 result — pinned nodes: ${Object.keys(hints.bypassPinData).join(', ') || 'none'}`);
        }
        return hints;
    }
    async generateBypassPinData(workflowEntity, bypassNodeNames, globalContext, timings, warnings, scenarioHints) {
        if (bypassNodeNames.length === 0)
            return {};
        try {
            const dataTableColumns = await this.resolveDataTableColumns(workflowEntity, bypassNodeNames);
            const result = await timings.time('bypass-pin', undefined, async () => await (0, pin_data_generator_1.generatePinData)({
                workflow: workflowEntity,
                nodeNames: bypassNodeNames,
                instructions: globalContext || scenarioHints
                    ? { dataDescription: globalContext, testScenario: scenarioHints }
                    : undefined,
                outputSchemaLookup: this.loadNodesAndCredentials.createOutputSchemaLookup(),
                dataTableColumns,
            }));
            const normalized = (0, workflow_sdk_1.normalizePinData)(result);
            for (const nodeName of bypassNodeNames) {
                if (!normalized[nodeName]) {
                    this.logger.warn(`[EvalMock] Phase 1.5 produced no pin data for bypass node "${nodeName}" — pinning empty to prevent real execution`);
                    normalized[nodeName] = [];
                }
            }
            const bypassSet = new Set(bypassNodeNames);
            for (const node of workflowEntity.nodes) {
                if (!bypassSet.has(node.name) || !(0, workflow_analysis_1.emitsDataTableRows)(node))
                    continue;
                const filtered = (0, data_table_pin_filter_1.applyDataTableReadParameters)(node, normalized[node.name]);
                normalized[node.name] = filtered.items;
                for (const warning of filtered.warnings)
                    this.logger.warn(`[EvalMock] ${warning}`);
                warnings.push(...filtered.flags);
            }
            return normalized;
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[EvalMock] Phase 1.5 pin data generation failed: ${errorMsg}`);
            throw new Error(`FRAMEWORK ISSUE: Phase 1.5 pin data generation failed: ${errorMsg}`);
        }
    }
    async resolveDataTableColumns(workflowEntity, bypassNodeNames) {
        const bypassSet = new Set(bypassNodeNames);
        const readNodes = workflowEntity.nodes.filter((node) => bypassSet.has(node.name) && (0, workflow_analysis_1.emitsDataTableRows)(node));
        if (readNodes.length === 0)
            return undefined;
        const columnsByNode = {};
        let projectId;
        for (const node of readNodes) {
            try {
                projectId ??= (await this.ownershipService.getWorkflowProjectCached(workflowEntity.id)).id;
                const tableId = await this.resolveDataTableNodeId(node, projectId);
                if (!tableId) {
                    this.logger.warn(`[EvalMock] No Data Table found for node "${node.name}" — pinned rows fall back to prompt-only generation`);
                    continue;
                }
                const columns = await this.dataTableService.getColumns(tableId, projectId);
                columnsByNode[node.name] = columns.map(({ name, type }) => ({ name, type }));
            }
            catch (error) {
                this.logger.warn(`[EvalMock] Could not resolve Data Table columns for node "${node.name}" — pinned rows fall back to prompt-only generation`, { error: error instanceof Error ? error.message : String(error) });
            }
        }
        return Object.keys(columnsByNode).length > 0 ? columnsByNode : undefined;
    }
    async liveDataTableReads(workflowEntity, seededDataTableIds) {
        const live = new Set();
        if (!seededDataTableIds?.length)
            return live;
        const seeded = new Set(seededDataTableIds);
        const seededByLowerName = new Map();
        for (const table of await this.dataTableService.findDataTablesByIds(seededDataTableIds)) {
            seededByLowerName.set(table.name.toLowerCase(), table.id);
        }
        for (const node of workflowEntity.nodes) {
            if (!(0, workflow_analysis_1.isDataTableRead)(node))
                continue;
            const locator = dataTableLocator(node);
            if (!locator)
                continue;
            const tableId = locator.mode === 'name'
                ? seededByLowerName.get(locator.value.toLowerCase())
                : locator.value;
            if (tableId !== undefined && seeded.has(tableId))
                live.add(node.name);
        }
        return live;
    }
    async resolveDataTableNodeId(node, projectId) {
        const locator = dataTableLocator(node);
        if (!locator)
            return undefined;
        if (locator.mode !== 'name')
            return locator.value;
        const matches = await this.dataTableService.findDataTablesByNamesInProject(projectId, [
            locator.value,
        ]);
        const wanted = locator.value.toLowerCase();
        return (matches.find((m) => m.name.toLowerCase() === wanted) ?? matches.at(0))?.id;
    }
    async execute(workflowEntity, user, hints, timings, scenarioHints, interceptionEnabled = false, vendorLlmRouting, budget) {
        const nodeResults = Object.create(null);
        for (const node of workflowEntity.nodes) {
            if (node.disabled || !node.parameters)
                continue;
            fillSetupPendingResourceLocators(node.parameters);
        }
        for (const node of workflowEntity.nodes) {
            if (node.disabled || node.type !== 'n8n-nodes-base.wait')
                continue;
            const resume = node.parameters?.resume;
            if (resume === 'webhook' || resume === 'form')
                continue;
            node.parameters = { ...node.parameters, resume: 'timeInterval', amount: 0, unit: 'seconds' };
        }
        const workflow = this.buildWorkflow(workflowEntity);
        const hintedStart = hints.startNodeName
            ? this.asTriggerNode(workflow.nodes[hints.startNodeName])
            : undefined;
        const startNode = hintedStart ?? this.findStartNode(workflow);
        if (!startNode) {
            return this.errorResult((0, node_crypto_1.randomUUID)(), 'No trigger or start node found in the workflow');
        }
        const mockAbort = new AbortController();
        const mockHandler = (0, mock_handler_1.createLlmMockHandler)({
            scenarioHints,
            globalContext: hints.globalContext,
            nodeHints: hints.nodeHints,
            pinnedOutputs: summarizePinnedOutputs(hints.bypassPinData),
            signal: mockAbort.signal,
        });
        const binaryRequirement = (0, workflow_analysis_1.detectBinaryDependencies)(workflowEntity);
        const triggerPinData = this.buildTriggerPinData(startNode, hints.triggerContent, binaryRequirement, hints.triggerEmitsNoItems);
        const pinData = { ...triggerPinData, ...hints.bypassPinData };
        const pinDataNodeNames = Object.keys(pinData);
        this.patchParameterIssuesForEval(workflow, pinDataNodeNames);
        this.checkNodeConfig(workflow, nodeResults, pinDataNodeNames);
        const blockingIssues = this.issuesBlockingRun(workflow, startNode, pinDataNodeNames);
        if (blockingIssues) {
            const reason = new n8n_core_1.WorkflowHasIssuesError(blockingIssues, workflow.nodes).message;
            this.logger.warn(`[EvalMock] Workflow cannot start: ${reason}`);
            return this.buildPartialFailureResult((0, node_crypto_1.randomUUID)(), new Error(`n8n refused to start the workflow: ${reason}`), nodeResults, hints, undefined);
        }
        const executionData = this.buildExecutionData(startNode, pinData);
        if (Object.keys(triggerPinData).length > 0) {
            this.markNodeAsPinned(startNode.name, nodeResults);
        }
        for (const nodeName of Object.keys(hints.bypassPinData)) {
            this.markNodeAsPinned(nodeName, nodeResults);
        }
        let wireServer;
        let restoreNoProxy;
        let credentialsHelper;
        let dbExecutionId;
        try {
            let serverUrl;
            if (interceptionEnabled) {
                const llmCompletionMockHandler = (0, llm_completion_mock_1.createLlmCompletionMockHandler)({
                    scenarioHints,
                    globalContext: hints.globalContext,
                    nodeHints: hints.nodeHints,
                });
                const timedAiTurnHandler = async (request, node) => await timings.time('ai-turn', node.type, async () => await llmCompletionMockHandler(request, node));
                wireServer = new llm_wire_server_1.LlmWireServer({
                    mockHandler: timedAiTurnHandler,
                    rootToSubNode: vendorLlmRouting?.rootToSubNode,
                    onIntercept: (turn) => this.recordWireServerTurn(turn, nodeResults),
                    logger: this.logger,
                });
                serverUrl = await wireServer.start();
                restoreNoProxy = (0, proxy_1.ensureHostsBypassProxy)(['127.0.0.1', 'localhost']);
                this.logger.debug(`[EvalMock] Wire server listening at ${serverUrl}`);
            }
            const runData = {
                executionMode: 'evaluation',
                workflowData: { ...workflowEntity, staticData: undefined },
                userId: user.id,
                executionData,
                pinData,
                configureAdditionalData: (additionalData) => {
                    const runCredentialsHelper = new eval_mocked_credentials_helper_1.EvalMockedCredentialsHelper(additionalData.credentialsHelper, serverUrl, this.logger, vendorLlmRouting?.subNodeToRoot);
                    credentialsHelper = runCredentialsHelper;
                    additionalData.credentialsHelper = runCredentialsHelper;
                    additionalData.evalLlmMockHandler = this.createInterceptingHandler(mockHandler, nodeResults, timings);
                    additionalData.executeAgent = this.createEvalExecuteAgent({
                        mockHandler,
                        nodeResults,
                        timings,
                        hints,
                        scenarioHints,
                        credentialsHelper: runCredentialsHelper,
                        mocks: new Map(),
                        sessions: new Set(),
                    });
                },
            };
            await this.clearDeduplicationState(workflowEntity.id);
            dbExecutionId = await this.workflowRunner.run(runData);
            const runResult = await this.awaitRunWithinBudget(dbExecutionId, budget);
            if (!runResult) {
                return this.buildPartialFailureResult(dbExecutionId, new Error('Execution finished with no run data'), nodeResults, hints, credentialsHelper);
            }
            return await this.buildResult(dbExecutionId, runResult, nodeResults, hints, credentialsHelper);
        }
        catch (error) {
            return this.buildPartialFailureResult(dbExecutionId ?? (0, node_crypto_1.randomUUID)(), error, nodeResults, hints, credentialsHelper);
        }
        finally {
            mockAbort.abort();
            if (restoreNoProxy)
                restoreNoProxy();
            if (wireServer) {
                try {
                    await wireServer.stop();
                }
                catch (error) {
                    this.logger.warn('[EvalMock] Wire server teardown failed', {
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
            await this.blankPersistedStaticData(workflowEntity.id);
            await this.clearDeduplicationState(workflowEntity.id);
            timings.summary(this.logger);
        }
    }
    async blankPersistedStaticData(workflowId) {
        try {
            await this.workflowStaticDataService.saveStaticDataById(workflowId, {});
        }
        catch (error) {
            this.logger.warn('[EvalMock] Failed to blank workflow staticData after run', {
                workflowId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async clearDeduplicationState(workflowId) {
        if (!this.instanceAiConfig.evalInstance)
            return;
        try {
            await this.processedDataRepository.deleteForWorkflow(workflowId);
        }
        catch (error) {
            this.logger.warn('[EvalMock] Failed to clear workflow deduplication state', {
                workflowId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    buildWorkflow(workflowEntity) {
        return new n8n_workflow_1.Workflow({
            id: workflowEntity.id,
            name: workflowEntity.name,
            nodes: workflowEntity.nodes,
            connections: workflowEntity.connections,
            active: false,
            nodeTypes: this.nodeTypes,
            staticData: workflowEntity.staticData,
            settings: workflowEntity.settings ?? {},
        });
    }
    findStartNode(workflow) {
        return workflow.getStartNode() ?? this.findWebhookNode(workflow);
    }
    triggerStartNode(workflowEntity, hints) {
        const hinted = hints.startNodeName
            ? workflowEntity.nodes.find((node) => node.name === hints.startNodeName)
            : undefined;
        return (this.asTriggerNode(hinted) ??
            this.asTriggerNode(this.findStartNode(this.buildWorkflow(workflowEntity))));
    }
    issuesBlockingRun(workflow, startNode, pinDataNodeNames) {
        const issues = {};
        for (const nodeName of [...workflow.getChildNodes(startNode.name), startNode.name]) {
            const node = workflow.nodes[nodeName];
            if (!node || node.disabled)
                continue;
            const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            const nodeIssues = nodeType
                ? n8n_workflow_1.NodeHelpers.getNodeParametersIssues(nodeType.description.properties, node, nodeType.description, pinDataNodeNames)
                : { typeUnknown: true };
            if (nodeIssues)
                issues[node.name] = nodeIssues;
        }
        return Object.keys(issues).length > 0 ? issues : null;
    }
    asTriggerNode(node) {
        if (!node || node.disabled)
            return undefined;
        const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        if (!nodeType)
            return undefined;
        const isTriggerCapable = 'trigger' in nodeType || 'poll' in nodeType || 'webhook' in nodeType;
        return isTriggerCapable ? node : undefined;
    }
    findWebhookNode(workflow) {
        return Object.values(workflow.nodes).find((node) => {
            if (node.disabled)
                return false;
            const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            return nodeType !== undefined && 'webhook' in nodeType;
        });
    }
    checkNodeConfig(workflow, nodeResults, pinDataNodeNames) {
        for (const node of Object.values(workflow.nodes)) {
            if (node.disabled)
                continue;
            const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            if (!nodeType)
                continue;
            const issues = n8n_workflow_1.NodeHelpers.getNodeParametersIssues(nodeType.description.properties, node, nodeType.description, pinDataNodeNames);
            const parameterIssues = { ...(issues?.parameters ?? {}) };
            for (const [paramName, value] of Object.entries(node.parameters ?? {})) {
                if (value === '__evalMockValue') {
                    parameterIssues[paramName] ??= [`Parameter "${paramName}" is required.`];
                }
            }
            if (Object.keys(parameterIssues).length > 0) {
                const entry = (nodeResults[node.name] ??= {
                    outputs: {},
                    outputCount: 0,
                    iterationCount: 0,
                    interceptedRequests: [],
                    executionMode: 'real',
                });
                entry.configIssues = parameterIssues;
            }
        }
    }
    patchParameterIssuesForEval(workflow, pinDataNodeNames) {
        for (const node of Object.values(workflow.nodes)) {
            if (node.disabled)
                continue;
            if (pinDataNodeNames.includes(node.name))
                continue;
            if (node.parameters) {
                node.parameters = scrubPlaceholderValues(node.parameters);
                for (const change of patchSetupPendingResourceMappers(node.parameters)) {
                    this.logger.info(`[EvalMock] resourceMapper patch on "${node.name}": ${change}`);
                }
            }
            const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            if (!nodeType)
                continue;
            const issues = n8n_workflow_1.NodeHelpers.getNodeParametersIssues(nodeType.description.properties, node, nodeType.description, pinDataNodeNames);
            const paramIssues = issues?.parameters;
            if (!paramIssues || Object.keys(paramIssues).length === 0)
                continue;
            const params = node.parameters ?? {};
            for (const paramName of Object.keys(paramIssues)) {
                params[paramName] = synthesizeMissingParamValue(params[paramName], paramName);
            }
            node.parameters = params;
        }
    }
    buildTriggerPinData(startNode, triggerContent, binaryRequirement, triggerEmitsNoItems = false) {
        if (triggerEmitsNoItems)
            return { [startNode.name]: [] };
        if (Object.keys(triggerContent).length === 0 && !binaryRequirement) {
            return startNode.type === n8n_workflow_1.MANUAL_TRIGGER_NODE_TYPE
                ? { [startNode.name]: [{ json: {} }] }
                : {};
        }
        const embedded = readEmbeddedBinaryMeta(triggerContent);
        const item = { json: triggerContent };
        const binary = {};
        const embeddedKeys = Object.keys(embedded);
        if (binaryRequirement &&
            (embeddedKeys.length === 0 || embeddedKeys.includes(binaryRequirement.propertyName))) {
            const embeddedMeta = embedded[binaryRequirement.propertyName];
            const isGenericFallback = binaryRequirement.contentType === 'application/octet-stream' &&
                binaryRequirement.filename === 'input.bin';
            binary[binaryRequirement.propertyName] = synthesizeBinaryEntry((isGenericFallback && embeddedMeta?.mimeType) || binaryRequirement.contentType, (isGenericFallback && embeddedMeta?.fileName) || binaryRequirement.filename, embeddedMeta?.text);
        }
        for (const [key, meta] of Object.entries(embedded)) {
            if (binary[key])
                continue;
            binary[key] = synthesizeBinaryEntry(meta.mimeType ?? 'application/octet-stream', meta.fileName ?? 'input.bin', meta.text);
        }
        if (Object.keys(binary).length > 0)
            item.binary = binary;
        return { [startNode.name]: [item] };
    }
    buildExecutionData(startNode, pinData) {
        return (0, n8n_workflow_1.createRunExecutionData)({
            startData: {},
            resultData: { pinData, runData: {} },
            executionData: {
                contextData: {},
                metadata: {},
                nodeExecutionStack: [
                    {
                        node: startNode,
                        data: { main: [[{ json: {} }]] },
                        source: null,
                    },
                ],
                waitingExecution: {},
                waitingExecutionSource: {},
            },
        });
    }
    recordWireServerTurn(turn, nodeResults) {
        const entry = (nodeResults[turn.rootName] ??= {
            outputs: {},
            outputCount: 0,
            iterationCount: 0,
            interceptedRequests: [],
            executionMode: 'mocked',
        });
        if (entry.executionMode !== 'pinned') {
            entry.executionMode = 'mocked';
        }
        entry.interceptedRequests.push({
            url: turn.url,
            method: turn.method,
            nodeType: turn.nodeType,
            requestBody: turn.requestBody,
            mockResponse: turn.mockResponse,
        });
        this.logger.debug(`[EvalMock] Wire server intercepted ${turn.method} ${turn.url} attributed to root "${turn.rootName}"`);
    }
    createEvalExecuteAgent(run, attributeTo) {
        return async (source, message, executionId, threadId, agentAdditionalData, mode, outputSchema, workflowContext, invocationContext) => {
            if (!workflowContext) {
                throw new n8n_workflow_1.UnexpectedError('An eval run cannot attribute an agent call without its node');
            }
            const callingNode = attributeTo ?? workflowContext.callingNodeName;
            const session = `${source.agentId ?? `inline:${workflowContext.callingNodeName}`}:${threadId}`;
            const continuesSession = workflowContext.hasCallerSessionId === true && run.sessions.has(session);
            run.sessions.add(session);
            return await (0, workflow_execute_additional_data_1.executeAgent)(source, message, executionId, threadId, agentAdditionalData, mode, outputSchema, workflowContext, invocationContext, this.prepareCalledAgent(callingNode, run, continuesSession));
        };
    }
    prepareCalledAgent(callingNode, run, continuesSession) {
        const warn = (feature, reason) => {
            const warning = `"${callingNode}" calls an Agent; the eval turned off its ${feature}: ${reason}`;
            if (!run.hints.warnings.includes(warning))
                run.hints.warnings.push(warning);
        };
        return async (original, { hasChatIntegrations } = {}) => {
            const { config, skippedFeatures } = (0, agent_execution_service_1.pruneConfigForEval)(original);
            if (hasChatIntegrations) {
                warn('chat integrations', 'an eval run cannot fake the chat SDKs they post through.');
            }
            for (const { feature, reason } of skippedFeatures) {
                if (feature !== 'memory')
                    warn(feature, reason);
                else if (continuesSession)
                    warn(feature, 'this call does not see its earlier turns.');
            }
            return {
                config,
                instrumentation: {
                    ...(await this.calledAgentMocks(callingNode, config, run)),
                    configureToolAdditionalData: (toolData) => {
                        toolData.credentialsHelper = run.credentialsHelper;
                        toolData.evalLlmMockHandler = this.createInterceptingHandler(run.mockHandler, run.nodeResults, run.timings, callingNode);
                        toolData.executeAgent = this.createEvalExecuteAgent(run, callingNode);
                    },
                    transformDelegatedAgentConfig: (childConfig, { subAgentId }) => {
                        const pruned = (0, agent_execution_service_1.pruneConfigForEval)(childConfig);
                        for (const { feature, reason } of pruned.skippedFeatures) {
                            if (feature !== 'memory')
                                warn(`sub-agent ${subAgentId}'s ${feature}`, reason);
                        }
                        const mocked = new Set((config.mcpServers ?? []).map((server) => server.url));
                        const mcpServers = pruned.config.mcpServers?.filter((server) => {
                            if (mocked.has(server.url))
                                return true;
                            warn(`sub-agent ${subAgentId}'s MCP server "${server.name}"`, 'the eval mocks only the MCP servers of the agent the workflow calls.');
                            return false;
                        });
                        return mcpServers ? { ...pruned.config, mcpServers } : pruned.config;
                    },
                },
            };
        };
    }
    async calledAgentMocks(callingNode, config, run) {
        const mcpServers = config.mcpServers ?? [];
        const key = JSON.stringify([callingNode, config.instructions, mcpServers]);
        const cached = run.mocks.get(key);
        if (cached)
            return await cached;
        const record = (request) => {
            this.mockedEntry(run.nodeResults, callingNode).interceptedRequests.push(request);
        };
        const mockContext = {
            agentInstructions: config.instructions,
            scenarioHints: run.scenarioHints,
            globalContext: run.hints.globalContext,
            logger: this.logger,
        };
        const mocks = (async () => ({
            mcpFetch: (0, mcp_mock_fetch_1.createMcpMockFetch)({
                ...mockContext,
                servers: mcpServers.map(({ name, url, description }) => ({ name, url, description })),
                knownToolsByServer: await (0, agent_execution_service_1.resolveCanonicalMcpCatalogs)(mcpServers, this.moduleRegistry, this.logger),
                onToolCall: (call) => record({
                    url: mcpServers.find((server) => server.name === call.serverName)?.url ?? call.serverName,
                    method: 'POST',
                    nodeType: `mcp:${call.serverName}`,
                    requestBody: call.args,
                    mockResponse: call.result,
                }),
            }),
            webSearch: (0, web_search_mock_1.createWebSearchMock)({
                ...mockContext,
                onSearch: (args, result) => record({
                    url: 'mock://web-search',
                    method: 'POST',
                    nodeType: 'web-search:fallback',
                    requestBody: args,
                    mockResponse: result,
                }),
            }),
        }))();
        run.mocks.set(key, mocks);
        return await mocks;
    }
    mockedEntry(nodeResults, nodeName) {
        const entry = (nodeResults[nodeName] ??= {
            outputs: {},
            outputCount: 0,
            iterationCount: 0,
            interceptedRequests: [],
            executionMode: 'mocked',
        });
        entry.executionMode = 'mocked';
        return entry;
    }
    createInterceptingHandler(mockHandler, nodeResults, timings, attributeTo) {
        return async (requestOptions, node) => {
            const entry = this.mockedEntry(nodeResults, attributeTo ?? node.name);
            let response = await timings.time('http-mock', attributeTo ?? node.name, async () => await mockHandler(requestOptions, node));
            if (response && response.statusCode < 400 && (0, openai_responses_envelope_1.isOpenAiResponsesUrl)(requestOptions.url)) {
                const normalized = (0, openai_responses_envelope_1.normalizeOpenAiResponsesMockResponse)(response, (0, openai_responses_envelope_1.extractResponsesRequestModel)(requestOptions.body));
                if (normalized !== response) {
                    this.logger.debug(`[EvalMock] Applied Responses-envelope normalization for "${node.name}"`);
                }
                response = normalized;
            }
            entry.interceptedRequests.push({
                url: requestOptions.url ?? '(no URL)',
                method: requestOptions.method ?? 'GET',
                nodeType: node.type,
                requestBody: requestOptions.body,
                mockResponse: (0, ledger_snapshot_1.snapshotLedgerBody)(response?.body),
            });
            this.logger.debug(`[EvalMock] Intercepted ${requestOptions.method ?? 'GET'} ${requestOptions.url} from "${node.name}" (${node.type})`);
            return response;
        };
    }
    markNodeAsPinned(nodeName, nodeResults) {
        const existing = nodeResults[nodeName];
        nodeResults[nodeName] = {
            outputs: {},
            outputCount: 0,
            iterationCount: 0,
            interceptedRequests: [],
            executionMode: 'pinned',
            ...(existing?.configIssues ? { configIssues: existing.configIssues } : {}),
        };
    }
    async awaitRunWithinBudget(executionId, budget) {
        const postExecute = this.activeExecutions.getPostExecutePromise(executionId);
        if (!budget)
            return await postExecute;
        postExecute.catch(() => { });
        const remainingMs = Math.max(budget.deadlineAt - Date.now(), 0);
        const seconds = Math.round(budget.totalMs / 1000);
        const budgetError = () => new Error(`Execution exceeded its ${seconds}s eval budget and was stopped`);
        let stoppedForBudget = false;
        let deadline;
        try {
            return await Promise.race([
                postExecute,
                new Promise((_resolve, reject) => {
                    deadline = setTimeout(() => {
                        stoppedForBudget = true;
                        this.logger.warn(`[EvalMock] Execution ${executionId} exceeded its ${seconds}s budget — stopping it`);
                        this.activeExecutions.stopExecution(executionId, new n8n_workflow_1.TimeoutExecutionCancelledError(executionId));
                        reject(budgetError());
                    }, remainingMs);
                }),
            ]);
        }
        catch (error) {
            throw stoppedForBudget ? budgetError() : error;
        }
        finally {
            if (deadline)
                clearTimeout(deadline);
        }
    }
    buildPartialFailureResult(executionId, error, nodeResults, hints, credentialsHelper) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`[EvalMock] Workflow execution failed: ${message}`);
        return {
            executionId,
            success: false,
            nodeResults,
            errors: [`Execution failed: ${message}`],
            hints: withInterceptionGaps(hints, credentialsHelper),
            mockedCredentials: credentialsHelper?.mockedCredentials ?? [],
            rewrittenCredentials: credentialsHelper?.rewrittenCredentials ?? [],
        };
    }
    async hydrateBinaryData(items) {
        return await Promise.all(items.map(async (item) => {
            if (!item.binary)
                return item;
            const hydratedBinary = {};
            for (const [key, entry] of Object.entries(item.binary)) {
                if (entry.id) {
                    try {
                        const buffer = await this.binaryDataService.getAsBuffer(entry);
                        hydratedBinary[key] = { ...entry, data: buffer.toString('base64') };
                        continue;
                    }
                    catch (error) {
                        this.logger.warn(`[EvalMock] Failed to hydrate binary "${key}" (${entry.id}): ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                hydratedBinary[key] = entry;
            }
            return { ...item, binary: hydratedBinary };
        }));
    }
    async buildResult(executionId, result, nodeResults, hints, credentialsHelper) {
        const errors = [];
        const runData = result.data?.resultData?.runData ?? {};
        for (const [nodeName, nodeRuns] of Object.entries(runData)) {
            const entry = (nodeResults[nodeName] ??= {
                outputs: {},
                outputCount: 0,
                iterationCount: 0,
                interceptedRequests: [],
                executionMode: 'real',
            });
            entry.iterationCount = nodeRuns.length;
            const firstErrorIdx = nodeRuns.findIndex((run) => run?.error !== undefined);
            if (firstErrorIdx !== -1) {
                entry.firstErrorIteration = firstErrorIdx;
            }
            const lastRun = nodeRuns[nodeRuns.length - 1];
            if (lastRun?.startTime) {
                entry.startTime = lastRun.startTime;
            }
            if (lastRun?.data) {
                let totalCount = 0;
                let truncated = false;
                const outputs = {};
                for (const [connectionType, branches] of Object.entries(lastRun.data)) {
                    if (!Array.isArray(branches))
                        continue;
                    outputs[connectionType] = await Promise.all(branches.map(async (branch) => {
                        if (!Array.isArray(branch))
                            return [];
                        totalCount += branch.length;
                        let kept = branch;
                        if (branch.length > MAX_OUTPUT_ITEMS_PER_BRANCH) {
                            truncated = true;
                            kept = branch.slice(0, MAX_OUTPUT_ITEMS_PER_BRANCH);
                        }
                        return await this.hydrateBinaryData(kept);
                    }));
                }
                entry.outputs = outputs;
                entry.outputCount = totalCount;
                if (truncated)
                    entry.truncated = true;
            }
            if (lastRun?.error) {
                errors.push(`Node "${nodeName}": ${lastRun.error.message}`);
            }
        }
        const executionError = result.data?.resultData?.error;
        if (executionError) {
            errors.push(`Workflow error: ${executionError.message}`);
        }
        const configIssueErrors = collectConfigIssueErrors(nodeResults);
        const allErrors = [...errors, ...configIssueErrors];
        return {
            executionId,
            success: allErrors.length === 0,
            nodeResults,
            errors: allErrors,
            hints: withInterceptionGaps(hints, credentialsHelper),
            mockedCredentials: credentialsHelper?.mockedCredentials ?? [],
            rewrittenCredentials: credentialsHelper?.rewrittenCredentials ?? [],
        };
    }
    errorResult(executionId, message) {
        return {
            executionId,
            success: false,
            nodeResults: {},
            errors: [message],
            hints: {
                globalContext: '',
                triggerContent: {},
                nodeHints: {},
                warnings: [],
                bypassPinData: {},
            },
            mockedCredentials: [],
            rewrittenCredentials: [],
        };
    }
};
exports.EvalExecutionService = EvalExecutionService;
exports.EvalExecutionService = EvalExecutionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_finder_service_1.WorkflowFinderService, node_types_1.NodeTypes, backend_common_1.Logger, posthog_1.PostHogClient, workflow_runner_1.WorkflowRunner, active_executions_1.ActiveExecutions, config_1.ExecutionsConfig, n8n_core_1.BinaryDataService, workflow_static_data_service_1.WorkflowStaticDataService, load_nodes_and_credentials_1.LoadNodesAndCredentials, ownership_service_1.OwnershipService, data_table_service_1.DataTableService, db_1.ProcessedDataRepository, config_1.InstanceAiConfig, backend_common_1.ModuleRegistry])
], EvalExecutionService);
function lacksTriggerContent(hints) {
    return !hints.triggerEmitsNoItems && Object.keys(hints.triggerContent).length === 0;
}
function withInterceptionGaps(hints, credentialsHelper) {
    const gaps = credentialsHelper?.interceptionGaps ?? [];
    if (gaps.length === 0)
        return hints;
    return { ...hints, warnings: [...hints.warnings, ...gaps] };
}
function synthesizeBinaryEntry(contentType, filename, text) {
    const bytes = (0, n8n_core_1.synthesizeBinaryFixture)(contentType, filename, { text });
    const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.') + 1) : 'bin';
    return {
        mimeType: contentType,
        fileName: filename,
        fileExtension: extension,
        fileType: (0, n8n_workflow_1.fileTypeFromMimeType)(contentType.toLowerCase()),
        data: bytes.toString('base64'),
    };
}
function nonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}
function readEmbeddedBinaryMeta(triggerContent) {
    const candidate = triggerContent.binary;
    if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) {
        return {};
    }
    const entries = Object.entries(candidate);
    if (entries.length === 0)
        return {};
    const embedded = {};
    for (const [key, value] of entries) {
        if (value === null || typeof value !== 'object' || Array.isArray(value))
            return {};
        const v = value;
        const mimeType = nonEmptyString(v.mimeType) ?? nonEmptyString(v.mimetype) ?? nonEmptyString(v.contentType);
        const strictFileName = nonEmptyString(v.fileName) ?? nonEmptyString(v.filename);
        if (!mimeType && !strictFileName)
            return {};
        embedded[key] = {
            mimeType,
            fileName: strictFileName ?? nonEmptyString(v.name),
            text: nonEmptyString(v.text),
        };
    }
    return embedded;
}
const PLACEHOLDER_PREFIX = '<__PLACEHOLDER_VALUE__';
const PLACEHOLDER_SUFFIX = '__>';
function synthesizePlaceholderValue(hint) {
    const h = hint.toLowerCase();
    if (h.includes('email'))
        return 'eval-mock@example.com';
    if (h.includes('url') || h.includes('endpoint') || h.includes('webhook')) {
        return 'https://eval-mock.invalid/';
    }
    if (h.includes('phone'))
        return '+10000000000';
    if (h.includes('slack channel') || h.includes('channel'))
        return 'C00000000EVAL';
    if (h.includes('chat') && h.includes('id'))
        return '100000000';
    if (h.includes('telegram'))
        return '100000000';
    if (/\bid\b/.test(h) || h.includes('account'))
        return '100000000';
    const selectedResourceValue = synthesizeSelectedResourcePlaceholderValue(h);
    if (selectedResourceValue)
        return selectedResourceValue;
    return '__evalMockValue';
}
function synthesizeSelectedResourcePlaceholderValue(hint) {
    if (!hint.includes('select'))
        return undefined;
    if (hint.includes('spreadsheet') || hint.includes('document'))
        return 'eval-spreadsheet-id';
    if (hint.includes('sheet'))
        return '0';
    if (hint.includes('calendar'))
        return 'eval-calendar-id';
    if (hint.includes('folder'))
        return 'eval-folder-id';
    if (hint.includes('file'))
        return 'eval-file-id';
    if (hint.includes('drive'))
        return 'eval-drive-id';
    return undefined;
}
function scrubPlaceholderValues(value) {
    if (typeof value === 'string') {
        if (!value.startsWith(PLACEHOLDER_PREFIX) || !value.endsWith(PLACEHOLDER_SUFFIX)) {
            return value;
        }
        const hint = value.slice(PLACEHOLDER_PREFIX.length, -PLACEHOLDER_SUFFIX.length);
        return synthesizePlaceholderValue(hint);
    }
    if (Array.isArray(value))
        return value.map(scrubPlaceholderValues);
    if (value !== null && typeof value === 'object') {
        const out = {};
        for (const [key, child] of Object.entries(value)) {
            out[key] = scrubPlaceholderValues(child);
        }
        return out;
    }
    return value;
}
function synthesizeResourceLocatorValue(paramName) {
    const h = paramName.toLowerCase();
    if (h.includes('spreadsheet') || h.includes('document'))
        return 'eval-spreadsheet-id';
    if (h.includes('sheet'))
        return '0';
    if (h.includes('calendar'))
        return 'eval-calendar-id';
    if (h.includes('folder'))
        return 'eval-folder-id';
    if (h.includes('file'))
        return 'eval-file-id';
    if (h.includes('drive'))
        return 'eval-drive-id';
    if (h.includes('channel'))
        return 'C00000000EVAL';
    return '__evalMockResource';
}
function fillSetupPendingResourceLocators(parameters) {
    for (const [key, raw] of Object.entries(parameters)) {
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
            continue;
        const rl = raw;
        if (!('__rl' in rl))
            continue;
        const value = rl.value;
        const isEmpty = value === undefined || value === null || value === '';
        if (!isEmpty)
            continue;
        parameters[key] = {
            ...rl,
            value: synthesizeResourceLocatorValue(key),
        };
    }
}
function synthesizeMissingParamValue(current, paramName = '') {
    if (current !== null &&
        typeof current === 'object' &&
        !Array.isArray(current) &&
        '__rl' in current) {
        const rl = current;
        const mode = typeof rl.mode === 'string' && rl.mode.length > 0 ? rl.mode : 'id';
        const rawValue = rl.value;
        const hasValue = (typeof rawValue === 'string' && rawValue.length > 0) ||
            (typeof rawValue === 'number' && Number.isFinite(rawValue));
        return {
            ...rl,
            mode,
            value: hasValue ? rawValue : synthesizeResourceLocatorValue(paramName),
        };
    }
    if (typeof current === 'string' && current.length === 0)
        return '__evalMockValue';
    if (current === null || current === undefined)
        return '__evalMockValue';
    return current;
}
function patchSetupPendingResourceMappers(parameters) {
    const changes = [];
    for (const [key, raw] of Object.entries(parameters)) {
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
            continue;
        const mapper = raw;
        if (!('mappingMode' in mapper) || mapper.mappingMode !== 'defineBelow')
            continue;
        const value = mapper.value;
        const mappingKeys = value !== null && typeof value === 'object' && !Array.isArray(value)
            ? Object.keys(value)
            : [];
        if (mappingKeys.length === 0) {
            parameters[key] = {
                ...mapper,
                mappingMode: 'autoMapInputData',
                value: null,
                schema: Array.isArray(mapper.schema) ? mapper.schema : [],
            };
            changes.push(`${key}: defineBelow without mappings → autoMapInputData`);
            continue;
        }
        const schema = mapper.schema;
        if (Array.isArray(schema) && schema.length > 0)
            continue;
        changes.push(`${key}: synthesized schema from ${String(mappingKeys.length)} mapping keys`);
        parameters[key] = {
            ...mapper,
            schema: mappingKeys.map((id) => ({
                id,
                displayName: id,
                required: false,
                defaultMatch: false,
                display: true,
                type: 'string',
                canBeUsedToMatch: true,
            })),
        };
    }
    return changes;
}
function summarizePinnedOutputs(pinData) {
    if (!pinData)
        return undefined;
    const lines = [];
    for (const [nodeName, items] of Object.entries(pinData)) {
        const meaningful = items.filter((item) => Object.keys(item.json ?? {}).length > 0 || item.binary !== undefined);
        if (meaningful.length === 0)
            continue;
        let json = '';
        try {
            json = JSON.stringify(meaningful);
        }
        catch {
            continue;
        }
        if (json.length > 1500)
            json = json.slice(0, 1500) + '…';
        lines.push(`- ${nodeName}: ${json}`);
    }
    return lines.length > 0 ? lines.join('\n') : undefined;
}
function collectConfigIssueErrors(nodeResults) {
    const errors = [];
    for (const [nodeName, result] of Object.entries(nodeResults)) {
        const issues = result.configIssues;
        if (!issues || Object.keys(issues).length === 0)
            continue;
        const issueMessages = Object.values(issues).flat();
        if (issueMessages.length === 0)
            continue;
        errors.push(`Node "${nodeName}" has missing or invalid configuration: ${issueMessages.join('; ')}`);
    }
    return errors;
}
//# sourceMappingURL=execution.service.js.map