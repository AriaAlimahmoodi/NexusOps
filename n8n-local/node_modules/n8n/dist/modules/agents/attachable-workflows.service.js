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
exports.AttachableWorkflowsService = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const SUPPORTED_TRIGGER_TYPES = api_types_1.SUPPORTED_WORKFLOW_TOOL_TRIGGERS;
const MAX_ATTACHABLE_WORKFLOWS = 10;
let AttachableWorkflowsService = class AttachableWorkflowsService {
    constructor(workflowFinderService) {
        this.workflowFinderService = workflowFinderService;
    }
    async list(user, projectId, searchTerm = '') {
        const { workflows } = await this.workflowFinderService.findWorkflowsForUser(user, ['workflow:read'], { filters: { projectId } });
        const normalizedSearchTerm = searchTerm.trim().toLowerCase();
        const byId = new Map();
        for (const workflow of workflows) {
            if (!byId.has(workflow.id))
                byId.set(workflow.id, workflow);
        }
        return Array.from(byId.values())
            .filter((workflow) => normalizedSearchTerm === '' || workflow.name.toLowerCase().includes(normalizedSearchTerm))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .flatMap((workflow) => {
            const hasSupportedTrigger = (workflow.nodes ?? []).some((node) => SUPPORTED_TRIGGER_TYPES.includes(node.type));
            if (!hasSupportedTrigger)
                return [];
            return [
                {
                    id: workflow.id,
                    name: workflow.name,
                    published: workflow.activeVersionId !== null,
                    triggerType: 'executeWorkflow',
                },
            ];
        })
            .slice(0, MAX_ATTACHABLE_WORKFLOWS);
    }
};
exports.AttachableWorkflowsService = AttachableWorkflowsService;
exports.AttachableWorkflowsService = AttachableWorkflowsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_finder_service_1.WorkflowFinderService])
], AttachableWorkflowsService);
//# sourceMappingURL=attachable-workflows.service.js.map