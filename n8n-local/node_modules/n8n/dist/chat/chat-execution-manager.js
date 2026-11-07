"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatExecutionManager = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const execution_persistence_1 = require("../executions/execution-persistence");
const WorkflowExecuteAdditionalData = __importStar(require("../workflow-execute-additional-data"));
const workflow_helpers_1 = require("../workflow-helpers");
const workflow_runner_1 = require("../workflow-runner");
const utils_1 = require("./utils");
const node_types_1 = require("../node-types");
const ownership_service_1 = require("../services/ownership.service");
const utils_2 = require("../utils");
let ChatExecutionManager = class ChatExecutionManager {
    constructor(executionRepository, executionPersistence, workflowRunner, ownershipService, nodeTypes) {
        this.executionRepository = executionRepository;
        this.executionPersistence = executionPersistence;
        this.workflowRunner = workflowRunner;
        this.ownershipService = ownershipService;
        this.nodeTypes = nodeTypes;
    }
    async runWorkflow(execution, message) {
        if (!this.isChatDrivenExecution(execution)) {
            throw new n8n_workflow_1.UnexpectedError('Refusing to resume a non-chat node over chat', {
                extra: { executionId: execution.id },
            });
        }
        await this.workflowRunner.run(await this.getRunData(execution, message), true, true, {
            executionId: execution.id,
            expectedStatus: 'waiting',
            storedAt: execution.storedAt,
        });
    }
    async cancelExecution(executionId) {
        const execution = await this.executionPersistence.findSingleExecution(executionId, {
            includeData: true,
            unflattenData: true,
        });
        if (!execution)
            return;
        if (!this.isChatDrivenExecution(execution))
            return;
        if (['running', 'waiting', 'unknown'].includes(execution.status)) {
            await this.executionRepository.update({ id: executionId }, { status: 'canceled' });
        }
    }
    async findExecution(executionId) {
        return await this.executionPersistence.findSingleExecution(executionId, {
            includeData: true,
            unflattenData: true,
        });
    }
    getWorkflow(execution) {
        const { workflowData } = execution;
        return new n8n_workflow_1.Workflow({
            id: workflowData.id,
            name: workflowData.name,
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            active: workflowData.activeVersionId !== null,
            nodeTypes: this.nodeTypes,
            staticData: workflowData.staticData,
            settings: workflowData.settings,
        });
    }
    async mapFilesToBinaryData(context, files) {
        if (!files)
            return;
        const binary = {};
        for (const [index, file] of files.entries()) {
            const base64 = file.data;
            const buffer = Buffer.from(base64, n8n_workflow_1.BINARY_ENCODING);
            const binaryData = await context.helpers.prepareBinaryData(buffer, file.name, file.type);
            binary[`data_${index}`] = binaryData;
        }
        return binary;
    }
    resolveResumeTarget(execution, workflow) {
        const executionData = execution.data.executionData?.nodeExecutionStack[0];
        if (!executionData)
            return null;
        const node = (0, utils_1.findResumeNode)(executionData, workflow);
        if (!node)
            return null;
        const nodeType = workflow.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        return { node, nodeType, executionData };
    }
    tryResolveResumeTarget(execution) {
        try {
            return this.resolveResumeTarget(execution, this.getWorkflow(execution));
        }
        catch {
            return null;
        }
    }
    canResumeOverChat(execution) {
        const target = this.tryResolveResumeTarget(execution);
        if (!target)
            return false;
        const { node, nodeType } = target;
        if (typeof nodeType.onMessage !== 'function')
            return false;
        const isChatBasedNode = (0, utils_2.stripToolSuffix)(node.type) === n8n_workflow_1.CHAT_NODE_TYPE;
        if (isChatBasedNode && node.parameters?.blockUserInput === true)
            return false;
        return true;
    }
    resolveResumeNodeType(execution) {
        return this.tryResolveResumeTarget(execution)?.node.type;
    }
    isChatDrivenExecution(execution) {
        const target = this.tryResolveResumeTarget(execution);
        return !!target && typeof target.nodeType.onMessage === 'function';
    }
    async runNode(execution, message) {
        const workflow = this.getWorkflow(execution);
        const target = this.resolveResumeTarget(execution, workflow);
        if (!target)
            return null;
        const { node, nodeType, executionData } = target;
        const additionalData = await WorkflowExecuteAdditionalData.getBase({ workflowId: workflow.id });
        (0, utils_1.redirectIfToolExecutor)(execution, executionData, workflow);
        const inputData = executionData.data;
        const connectionInputData = executionData.data.main[0];
        const context = new n8n_core_1.ExecuteContext(workflow, node, additionalData, 'manual', execution.data, 0, connectionInputData ?? [], inputData, executionData, []);
        const { sessionId, action, chatInput, files } = message;
        const binary = await this.mapFilesToBinaryData(context, files);
        const nodeExecutionData = { json: { sessionId, action, chatInput } };
        if (binary && Object.keys(binary).length > 0) {
            nodeExecutionData.binary = binary;
        }
        if (nodeType.onMessage) {
            await workflow.expression.acquireIsolate();
            try {
                return await nodeType.onMessage(context, nodeExecutionData);
            }
            finally {
                await workflow.expression.releaseIsolate();
            }
        }
        return [[nodeExecutionData]];
    }
    async getRunData(execution, message) {
        const { workflowData, mode: executionMode, data: runExecutionData } = execution;
        const result = await this.runNode(execution, message);
        if ((0, n8n_core_1.isEngineRequest)(result)) {
            throw new n8n_workflow_1.UnexpectedError("Can't handle actions inside the chat trigger.");
        }
        runExecutionData.executionData.nodeExecutionStack[0].data.main = result ?? [
            [{ json: message }],
        ];
        const resumingNode = runExecutionData.executionData.nodeExecutionStack[0].node;
        const isChatBasedHitlTool = (0, n8n_workflow_1.isHitlToolType)(resumingNode.type) && (0, utils_2.stripToolSuffix)(resumingNode.type) === n8n_workflow_1.CHAT_NODE_TYPE;
        if (resumingNode.type === n8n_workflow_1.CHAT_TOOL_NODE_TYPE || isChatBasedHitlTool) {
            runExecutionData.waitTill = undefined;
            resumingNode.disabled = true;
            resumingNode.rewireOutputLogTo = n8n_workflow_1.NodeConnectionTypes.AiTool;
            const lastNodeExecuted = runExecutionData.resultData.lastNodeExecuted;
            const runDataArray = runExecutionData.resultData.runData[lastNodeExecuted];
            if (runDataArray?.length)
                (0, workflow_helpers_1.preserveInputOverride)(runDataArray);
        }
        let project = undefined;
        try {
            project = await this.ownershipService.getWorkflowProjectCached(workflowData.id);
        }
        catch (error) {
            throw new errors_1.NotFoundError('Cannot find workflow');
        }
        const runData = {
            executionMode,
            executionData: runExecutionData,
            pushRef: runExecutionData.pushRef,
            workflowData,
            pinData: runExecutionData.resultData.pinData,
            projectId: project?.id,
        };
        return runData;
    }
};
exports.ChatExecutionManager = ChatExecutionManager;
exports.ChatExecutionManager = ChatExecutionManager = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ExecutionRepository, execution_persistence_1.ExecutionPersistence, workflow_runner_1.WorkflowRunner, ownership_service_1.OwnershipService, node_types_1.NodeTypes])
], ChatExecutionManager);
//# sourceMappingURL=chat-execution-manager.js.map