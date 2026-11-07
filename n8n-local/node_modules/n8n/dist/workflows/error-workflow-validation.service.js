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
exports.ErrorWorkflowValidationService = void 0;
exports.isExpressionErrorWorkflowId = isExpressionErrorWorkflowId;
exports.staticErrorWorkflowId = staticErrorWorkflowId;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const workflow_finder_service_1 = require("./workflow-finder.service");
const backend_services_1 = require("@n8n/backend-services");
const subworkflow_policy_denial_error_1 = require("../errors/subworkflow-policy-denial.error");
const subworkflow_policy_checker_1 = require("../executions/pre-execution-checks/subworkflow-policy-checker");
const node_types_1 = require("../node-types");
function isExpressionErrorWorkflowId(errorWorkflow) {
    return typeof errorWorkflow === 'string' && errorWorkflow.startsWith('=');
}
function staticErrorWorkflowId(errorWorkflow) {
    if (typeof errorWorkflow !== 'string' ||
        errorWorkflow === '' ||
        errorWorkflow === 'DEFAULT' ||
        isExpressionErrorWorkflowId(errorWorkflow)) {
        return undefined;
    }
    return errorWorkflow;
}
let ErrorWorkflowValidationService = class ErrorWorkflowValidationService {
    constructor(globalConfig, nodeTypes, workflowFinderService, workflowPublishedDataService, subworkflowPolicyChecker) {
        this.globalConfig = globalConfig;
        this.nodeTypes = nodeTypes;
        this.workflowFinderService = workflowFinderService;
        this.workflowPublishedDataService = workflowPublishedDataService;
        this.subworkflowPolicyChecker = subworkflowPolicyChecker;
    }
    async findProblem({ errorWorkflowId, parentWorkflowId, user, }) {
        const { useWorkflowPublicationService } = this.globalConfig.workflows;
        const { errorTriggerType } = this.globalConfig.nodes;
        const errorWorkflow = await this.workflowFinderService.findWorkflowForUser(errorWorkflowId, user, ['workflow:read'], { includeActiveVersion: !useWorkflowPublicationService });
        if (!errorWorkflow)
            return { reason: 'not-found' };
        const publishedNodes = useWorkflowPublicationService
            ? (await this.workflowPublishedDataService.getPublishedWorkflowData(errorWorkflowId))
                ?.publishedVersion.nodes
            : errorWorkflow.activeVersionId && errorWorkflow.activeVersion
                ? (errorWorkflow.activeVersion.nodes ?? [])
                : undefined;
        if (!publishedNodes)
            return { reason: 'not-published', name: errorWorkflow.name };
        const hasErrorTrigger = publishedNodes.some((node) => node.type === errorTriggerType && node.disabled !== true);
        if (!hasErrorTrigger) {
            return { reason: 'no-error-trigger', name: errorWorkflow.name, errorTriggerType };
        }
        const errorWorkflowInstance = new n8n_workflow_1.Workflow({
            id: errorWorkflow.id,
            name: errorWorkflow.name,
            nodeTypes: this.nodeTypes,
            nodes: [],
            connections: {},
            active: false,
            settings: errorWorkflow.settings ?? {},
        });
        try {
            await this.subworkflowPolicyChecker.check(errorWorkflowInstance, parentWorkflowId, undefined, user.id);
        }
        catch (error) {
            if (error instanceof subworkflow_policy_denial_error_1.SubworkflowPolicyDenialError) {
                return { reason: 'caller-policy', name: errorWorkflow.name };
            }
            throw error;
        }
        return undefined;
    }
};
exports.ErrorWorkflowValidationService = ErrorWorkflowValidationService;
exports.ErrorWorkflowValidationService = ErrorWorkflowValidationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, node_types_1.NodeTypes, workflow_finder_service_1.WorkflowFinderService, backend_services_1.WorkflowPublishedDataService, subworkflow_policy_checker_1.SubworkflowPolicyChecker])
], ErrorWorkflowValidationService);
//# sourceMappingURL=error-workflow-validation.service.js.map