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
exports.WorkflowPreExecute = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const execution_utils_1 = require("../execution.utils");
const pre_execute_blocked_error_1 = require("../../errors/pre-execute-blocked.error");
const external_hooks_1 = require("../../external-hooks");
const node_types_1 = require("../../node-types");
const workflow_hook_context_service_1 = require("../../workflow-hook-context.service");
let WorkflowPreExecute = class WorkflowPreExecute {
    constructor(externalHooks, workflowContext, nodeTypes, executionsConfig) {
        this.externalHooks = externalHooks;
        this.workflowContext = workflowContext;
        this.nodeTypes = nodeTypes;
        this.executionsConfig = executionsConfig;
    }
    async run(workflowData, mode, source, pinData) {
        if (this.executionsConfig.preExecuteErrorCreatesExecution) {
            return;
        }
        if (!this.externalHooks.hasHook('workflow.preExecute')) {
            return;
        }
        const workflow = new n8n_workflow_1.Workflow({
            id: workflowData.id,
            name: workflowData.name,
            nodes: workflowData.nodes ?? [],
            connections: workflowData.connections ?? {},
            active: (0, execution_utils_1.getWorkflowActiveStatusFromWorkflowData)(workflowData),
            nodeTypes: this.nodeTypes,
            staticData: workflowData.staticData,
            settings: workflowData.settings ?? {},
            pinData,
        });
        try {
            await this.externalHooks.run('workflow.preExecute', [
                workflow,
                mode,
                this.workflowContext,
                source,
            ]);
        }
        catch (error) {
            throw new pre_execute_blocked_error_1.PreExecuteBlockedError((0, ensure_error_1.ensureError)(error));
        }
        this.writeHookMutations(workflowData, workflow, pinData !== undefined);
        return workflow;
    }
    writeHookMutations(workflowData, workflow, pinDataWasSupplied) {
        workflowData.staticData = workflow.staticData;
        workflowData.settings = workflow.settings;
        workflowData.connections = workflow.connectionsBySourceNode;
        if (workflow.name !== undefined) {
            workflowData.name = workflow.name;
        }
        if (pinDataWasSupplied || workflow.pinData !== undefined) {
            workflowData.pinData = workflow.pinData;
        }
        workflowData.nodes = this.nodesFromWorkflow(workflow, workflowData.nodes ?? []);
    }
    nodesFromWorkflow(workflow, originalNodes) {
        const seen = new Set();
        const nodes = [];
        for (const node of originalNodes) {
            const current = workflow.nodes[node.name];
            if (current === undefined)
                continue;
            nodes.push(current);
            seen.add(node.name);
        }
        for (const [name, node] of Object.entries(workflow.nodes)) {
            if (seen.has(name))
                continue;
            nodes.push(node);
        }
        return nodes;
    }
};
exports.WorkflowPreExecute = WorkflowPreExecute;
exports.WorkflowPreExecute = WorkflowPreExecute = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [external_hooks_1.ExternalHooks, workflow_hook_context_service_1.WorkflowHookContextService, node_types_1.NodeTypes, config_1.ExecutionsConfig])
], WorkflowPreExecute);
//# sourceMappingURL=workflow-pre-execute.js.map