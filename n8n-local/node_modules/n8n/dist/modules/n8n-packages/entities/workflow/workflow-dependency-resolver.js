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
exports.WorkflowDependencyResolver = void 0;
const di_1 = require("@n8n/di");
const workflow_finder_service_1 = require("../../../../workflows/workflow-finder.service");
const extract_workflow_requirements_1 = require("./references/extract-workflow-requirements");
const workflow_version_policy_1 = require("./workflow-version-policy");
let WorkflowDependencyResolver = class WorkflowDependencyResolver {
    constructor(workflowFinder) {
        this.workflowFinder = workflowFinder;
    }
    async resolve(request) {
        const traverse = (request.traversal ?? 'transitive') === 'transitive';
        const policy = request.versionPolicy;
        const queue = [...new Set(request.workflowIds)];
        const seenWorkflowIds = new Set(queue);
        const requirements = [];
        while (queue.length > 0) {
            const workflowIds = queue.splice(0);
            const loaded = await this.workflowFinder.findWorkflowsByIdsForUser(workflowIds, request.user, ['workflow:export'], { includeActiveVersion: (0, workflow_version_policy_1.needsActiveVersion)(policy) });
            const workflows = (0, workflow_version_policy_1.applyWorkflowVersionPolicy)(loaded, policy);
            const workflowsById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
            for (const workflowId of workflowIds) {
                const workflow = workflowsById.get(workflowId);
                if (!workflow)
                    continue;
                const extractedRequirements = (0, extract_workflow_requirements_1.extractWorkflowRequirements)(workflow);
                requirements.push(...extractedRequirements);
                if (!traverse)
                    continue;
                for (const { referencedWorkflowId } of extractedRequirements) {
                    if (seenWorkflowIds.has(referencedWorkflowId))
                        continue;
                    seenWorkflowIds.add(referencedWorkflowId);
                    queue.push(referencedWorkflowId);
                }
            }
        }
        return requirements;
    }
};
exports.WorkflowDependencyResolver = WorkflowDependencyResolver;
exports.WorkflowDependencyResolver = WorkflowDependencyResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_finder_service_1.WorkflowFinderService])
], WorkflowDependencyResolver);
//# sourceMappingURL=workflow-dependency-resolver.js.map