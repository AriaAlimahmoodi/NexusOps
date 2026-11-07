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
exports.WorkflowToolWorkflowLoader = void 0;
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const workflow_tool_unavailable_error_1 = require("./workflow-tool-unavailable-error");
let WorkflowToolWorkflowLoader = class WorkflowToolWorkflowLoader {
    constructor(workflowRepository, workflowsConfig, workflowPublishedDataService) {
        this.workflowRepository = workflowRepository;
        this.workflowsConfig = workflowsConfig;
        this.workflowPublishedDataService = workflowPublishedDataService;
    }
    async loadWorkflow(projectId, reference, options = {}) {
        const workflow = await this.workflowRepository.findOneByAgentToolReference(projectId, reference, { withActiveVersion: options.usePublishedVersion === true });
        if (!workflow || workflow.isArchived)
            return null;
        if (options.usePublishedVersion) {
            const published = await this.resolvePublishedContent(workflow);
            if (!published) {
                throw new workflow_tool_unavailable_error_1.WorkflowToolUnavailableError('not_published', `Workflow "${workflow.name}" is not published. Publish it so the published agent can use it.`);
            }
            Object.assign(workflow, {
                versionId: published.versionId,
                nodes: published.nodes,
                connections: published.connections,
            });
        }
        return Object.assign(workflow, { pinData: undefined });
    }
    async resolvePublishedContent(workflow) {
        if (this.workflowsConfig.useWorkflowPublicationService) {
            const data = await this.workflowPublishedDataService.getPublishedWorkflowData(workflow.id);
            return data?.publishedVersion ?? null;
        }
        return workflow.activeVersion ?? null;
    }
};
exports.WorkflowToolWorkflowLoader = WorkflowToolWorkflowLoader;
exports.WorkflowToolWorkflowLoader = WorkflowToolWorkflowLoader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowRepository, config_1.WorkflowsConfig, backend_services_1.WorkflowPublishedDataService])
], WorkflowToolWorkflowLoader);
//# sourceMappingURL=workflow-tool-workflow-loader.service.js.map