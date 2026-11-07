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
exports.ExecuteNodeService = exports.MAX_EXECUTE_NODE_TIMEOUT_MS = exports.DEFAULT_EXECUTE_NODE_TIMEOUT_MS = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const active_executions_1 = require("../active-executions");
const backend_services_1 = require("@n8n/backend-services");
const errors_1 = require("@n8n/errors");
const execution_persistence_1 = require("../executions/execution-persistence");
const node_types_1 = require("../node-types");
const workflow_runner_1 = require("../workflow-runner");
const deprecated_nodes_validation_service_1 = require("../workflows/deprecated-nodes-validation.service");
exports.DEFAULT_EXECUTE_NODE_TIMEOUT_MS = 30_000;
exports.MAX_EXECUTE_NODE_TIMEOUT_MS = 60_000;
const NODE_NAME = 'Node';
const MULTI_MAIN_POLL_INTERVAL_MS = 1_000;
let ExecuteNodeService = class ExecuteNodeService {
    constructor(nodeTypes, credentialsFinderService, logger, workflowRepository, workflowRunner, activeExecutions, executionPersistence, instanceSettings, deprecatedNodesValidationService) {
        this.nodeTypes = nodeTypes;
        this.credentialsFinderService = credentialsFinderService;
        this.logger = logger;
        this.workflowRepository = workflowRepository;
        this.workflowRunner = workflowRunner;
        this.activeExecutions = activeExecutions;
        this.executionPersistence = executionPersistence;
        this.instanceSettings = instanceSettings;
        this.deprecatedNodesValidationService = deprecatedNodesValidationService;
    }
    async run(user, request) {
        const nodeType = this.resolveNodeType(request.type, request.version);
        this.assertExecutable(nodeType, request.type);
        const credentials = request.config.credentials
            ? this.normalizeCredentials(request.config.credentials)
            : undefined;
        await this.checkCredentialAccess(user, credentials);
        const node = this.buildNode(request, credentials);
        this.deprecatedNodesValidationService.validateOnCreate([node]);
        const timeoutMs = Math.min(request.timeoutMs ?? exports.DEFAULT_EXECUTE_NODE_TIMEOUT_MS, exports.MAX_EXECUTE_NODE_TIMEOUT_MS);
        const inputItems = request.input ?? [{ json: {} }];
        const workflow = await this.createTemporaryWorkflow(request.projectId, node, timeoutMs);
        try {
            return await this.execute(user, workflow, node, inputItems, timeoutMs);
        }
        catch (error) {
            return { status: 'error', error: this.toErrorResponse(error) };
        }
        finally {
            await this.deleteTemporaryWorkflow(workflow.id);
        }
    }
    resolveNodeType(type, version) {
        try {
            return this.nodeTypes.getByNameAndVersion(type, version);
        }
        catch (error) {
            throw new errors_1.BadRequestError(`Unknown node type "${type}" (version ${version})`, undefined, undefined, error);
        }
    }
    assertExecutable(nodeType, type) {
        if (nodeType.execute)
            return;
        if (nodeType.description.requestDefaults !== undefined)
            return;
        throw new errors_1.BadRequestError(`Node type "${type}" has no execute method and no routing support (e.g. it is trigger/webhook-only)`);
    }
    normalizeCredentials(credentials) {
        const normalized = {};
        for (const [credentialType, credential] of Object.entries(credentials)) {
            normalized[credentialType] = credential.__aiGatewayManaged
                ? { id: null, name: credential.name, __aiGatewayManaged: true }
                : credential;
        }
        return normalized;
    }
    async checkCredentialAccess(user, credentials) {
        for (const [credentialType, credential] of Object.entries(credentials ?? {})) {
            if (credential.__aiGatewayManaged)
                continue;
            if (!credential.id) {
                throw new errors_1.BadRequestError(`Credential reference for "${credentialType}" is missing an id`);
            }
            const accessible = await this.credentialsFinderService.findCredentialForUser(credential.id, user, ['credential:read']);
            if (!accessible) {
                throw new errors_1.ForbiddenError(`You do not have access to the "${credentialType}" credential used by this node`);
            }
        }
    }
    buildNode(request, credentials) {
        return {
            id: (0, uuid_1.v4)(),
            name: NODE_NAME,
            type: request.type,
            typeVersion: request.version,
            position: [0, 0],
            parameters: request.config.parameters,
            credentials,
        };
    }
    async createTemporaryWorkflow(projectId, node, timeoutMs) {
        const newWorkflow = new db_1.WorkflowEntity();
        newWorkflow.isArchived = true;
        newWorkflow.versionId = (0, uuid_1.v4)();
        newWorkflow.name = `Execute node ${node.type}`;
        newWorkflow.active = false;
        newWorkflow.activeVersionId = null;
        newWorkflow.nodes = [node];
        newWorkflow.connections = {};
        newWorkflow.settings = {
            executionOrder: 'v1',
            saveManualExecutions: true,
            saveDataSuccessExecution: 'all',
            saveDataErrorExecution: 'all',
            executionTimeout: Math.ceil(timeoutMs / 1000),
        };
        return await this.workflowRepository.createWorkflowWithOwner(newWorkflow, projectId);
    }
    async deleteTemporaryWorkflow(workflowId) {
        try {
            await this.executionPersistence.hardDeleteByWorkflowId(workflowId);
        }
        catch (error) {
            this.warnCleanupFailed(workflowId, error);
        }
        try {
            await this.workflowRepository.delete(workflowId);
        }
        catch (error) {
            this.warnCleanupFailed(workflowId, error);
        }
    }
    warnCleanupFailed(workflowId, error) {
        this.logger.warn('Failed to clean up temporary execute-node workflow', {
            workflowId,
            error: (0, get_error_message_1.getErrorMessage)(error),
        });
    }
    async execute(user, workflowData, node, inputItems, timeoutMs) {
        const executionData = (0, n8n_workflow_1.createRunExecutionData)({
            startData: {},
            resultData: { runData: {} },
            executionData: {
                contextData: {},
                metadata: {},
                nodeExecutionStack: [{ node, data: { main: [inputItems] }, source: null }],
                waitingExecution: {},
                waitingExecutionSource: {},
            },
            manualData: { userId: user.id },
        });
        const executionId = await this.workflowRunner.run({
            executionMode: 'manual',
            workflowData,
            executionData,
            userId: user.id,
        });
        const timedOut = await this.waitForCompletion(executionId, timeoutMs);
        if (timedOut) {
            return {
                status: 'error',
                error: { message: `Execution timed out after ${timeoutMs}ms and was cancelled` },
            };
        }
        return await this.extractResult(executionId, node.type);
    }
    async waitForCompletion(executionId, timeoutMs) {
        if (!this.activeExecutions.has(executionId))
            return false;
        const abort = new AbortController();
        let timeoutId;
        const timeout = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new n8n_workflow_1.TimeoutExecutionCancelledError(executionId)), timeoutMs + 1_000);
        });
        try {
            await Promise.race([this.waitForSettled(executionId, abort.signal), timeout]);
            return false;
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.TimeoutExecutionCancelledError) {
                abort.abort();
                try {
                    this.activeExecutions.stopExecution(executionId, error);
                }
                catch {
                }
                return true;
            }
            throw error;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    async waitForSettled(executionId, signal) {
        if (!this.instanceSettings.isMultiMain) {
            await this.activeExecutions.getPostExecutePromise(executionId);
            return;
        }
        while (!signal.aborted) {
            const execution = await this.executionPersistence.findSingleExecution(executionId, {
                includeData: false,
                unflattenData: false,
            });
            const inFlight = execution?.status === 'new' || execution?.status === 'running';
            if (!inFlight)
                return;
            await (0, sleep_1.sleep)(MULTI_MAIN_POLL_INTERVAL_MS, signal);
        }
    }
    async extractResult(executionId, nodeTypeName) {
        const execution = await this.executionPersistence.findSingleExecution(executionId, {
            includeData: true,
            unflattenData: true,
        });
        if (execution?.status === 'waiting' || execution?.waitTill) {
            return {
                status: 'error',
                error: {
                    message: `Node type "${nodeTypeName}" entered a wait state; standalone node execution does not support waiting or resuming (e.g. Wait nodes or send-and-wait operations)`,
                },
            };
        }
        const executionError = execution?.data?.resultData?.error;
        if (executionError) {
            return { status: 'error', error: this.toErrorResponse(executionError) };
        }
        const nodeRuns = execution?.data?.resultData?.runData?.[NODE_NAME];
        const lastRun = nodeRuns?.[nodeRuns.length - 1];
        if (lastRun?.error) {
            return { status: 'error', error: this.toErrorResponse(lastRun.error) };
        }
        const branches = lastRun?.data?.main;
        if (!branches) {
            return {
                status: 'error',
                error: { message: `Node type "${nodeTypeName}" produced no output` },
            };
        }
        return { status: 'success', output: this.toOutput(branches) };
    }
    toOutput(branches) {
        return branches.map((branch) => (branch ?? []).map((item) => this.toOutputItem(item)));
    }
    toOutputItem(item) {
        if (!item.binary)
            return { json: item.json };
        const binary = {};
        for (const [key, value] of Object.entries(item.binary)) {
            binary[key] = {
                fileName: value.fileName,
                mimeType: value.mimeType,
                fileSize: value.fileSize,
            };
        }
        return { json: item.json, binary };
    }
    toErrorResponse(error) {
        if (error instanceof n8n_workflow_1.NodeError) {
            return {
                message: error.message,
                description: error.description ?? undefined,
                nodeErrorType: error.constructor.name,
            };
        }
        if (error instanceof Error) {
            this.logger.debug('Execute node failed', { error: error.message });
            return { message: error.message };
        }
        if (typeof error === 'object' && error !== null && 'message' in error) {
            const revived = error;
            return {
                message: revived.message,
                description: revived.description ?? undefined,
                nodeErrorType: revived.name,
            };
        }
        return { message: 'Unknown error' };
    }
};
exports.ExecuteNodeService = ExecuteNodeService;
exports.ExecuteNodeService = ExecuteNodeService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [node_types_1.NodeTypes, backend_services_1.CredentialsFinderService, backend_common_1.Logger, db_1.WorkflowRepository, workflow_runner_1.WorkflowRunner, active_executions_1.ActiveExecutions, execution_persistence_1.ExecutionPersistence, n8n_core_1.InstanceSettings, deprecated_nodes_validation_service_1.DeprecatedNodesValidationService])
], ExecuteNodeService);
//# sourceMappingURL=execute-node.service.js.map