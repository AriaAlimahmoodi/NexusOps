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
exports.WorkflowPublisher = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const errors_1 = require("@n8n/errors");
const project_service_ee_1 = require("../../../../services/project.service.ee");
const constants_1 = require("../../../../webhooks/constants");
const webhook_service_1 = require("../../../../webhooks/webhook.service");
const workflow_service_1 = require("../../../../workflows/workflow.service");
const sub_workflow_ordering_1 = require("./sub-workflow-ordering");
const workflow_publishing_policy_1 = require("./workflow-publishing-policy");
const workflow_publishing_policy_types_1 = require("./workflow-publishing-policy.types");
let WorkflowPublisher = class WorkflowPublisher {
    constructor(logger, projectRepository, projectService, workflowService, webhookService) {
        this.logger = logger;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.workflowService = workflowService;
        this.webhookService = webhookService;
    }
    async applyToPackage({ user, persisted, policy, subWorkflowRequirements, }) {
        const results = new Map();
        const claimedPaths = new Set();
        for (const outcome of (0, sub_workflow_ordering_1.orderBySubWorkflowDependencies)(persisted, subWorkflowRequirements)) {
            if (outcome.status === 'skipped')
                continue;
            const webhookKeys = this.webhookKeysOnPublish(outcome, policy);
            const result = await this.apply(user, outcome.item, outcome.workflow, policy, outcome.blockedFromPublish, webhookKeys.some((key) => claimedPaths.has(key)));
            if (result.publishing.state === 'published') {
                for (const key of webhookKeys)
                    claimedPaths.add(key);
            }
            result.workflow.parentFolder =
                result.workflow.parentFolder ??
                    outcome.workflow.parentFolder ??
                    (outcome.item.action === 'update' ? outcome.item.existing.parentFolder : null) ??
                    null;
            results.set(outcome.sourceWorkflowId, result);
        }
        return results;
    }
    webhookKeysOnPublish(outcome, policy) {
        if (outcome.blockedFromPublish)
            return [];
        const action = (0, workflow_publishing_policy_1.decideWorkflowPublishingAction)(policy, toPublishingContext(outcome.item, outcome.workflow));
        if (action !== 'publish')
            return [];
        return this.webhookService.getStaticWebhookKeys(outcome.workflow.nodes);
    }
    async assertCanPublish(user, projectId, policy, projectPendingCreation = false) {
        if (policy !== workflow_publishing_policy_types_1.WorkflowPublishingPolicy.PublishAll) {
            return;
        }
        if (projectPendingCreation) {
            return;
        }
        const project = await this.projectService.getProjectWithScope(user, projectId, [
            'workflow:publish',
        ]);
        if (project) {
            return;
        }
        if (!(await this.projectRepository.existsBy({ id: projectId }))) {
            throw new errors_1.NotFoundError(`Project not found: ${projectId}`);
        }
        throw new errors_1.ForbiddenError('You do not have permission to publish workflows in this project.');
    }
    async apply(user, item, workflow, policy, blockedReason, webhookContested = false) {
        const action = (0, workflow_publishing_policy_1.decideWorkflowPublishingAction)(policy, toPublishingContext(item, workflow));
        if (action === 'noop') {
            return { workflow, publishing: { state: 'unchanged' } };
        }
        if (action === 'publish' && blockedReason) {
            if (workflow.activeVersionId) {
                return {
                    workflow,
                    publishing: {
                        state: 'unchanged',
                        skippedPublishReason: blockedReason,
                    },
                };
            }
            return {
                workflow,
                publishing: { state: 'blocked', blockedReason },
            };
        }
        if (action === 'publish' && webhookContested) {
            return this.failed(workflow, action, constants_1.WEBHOOK_CONFLICT_MESSAGE);
        }
        try {
            if (action === 'publish') {
                return {
                    workflow: await this.workflowService.activateWorkflow(user, workflow.id, {
                        versionId: workflow.versionId,
                        source: 'import',
                    }),
                    publishing: { state: 'published' },
                };
            }
            return {
                workflow: await this.workflowService.deactivateWorkflow(user, workflow.id, {
                    source: 'import',
                }),
                publishing: { state: 'unpublished' },
            };
        }
        catch (error) {
            return this.failed(workflow, action, (0, ensure_error_1.ensureError)(error).message);
        }
    }
    failed(workflow, action, error) {
        this.logger.warn('Failed to apply publishing policy to imported workflow', {
            workflowId: workflow.id,
            action,
            error,
        });
        return { workflow, publishing: { state: 'failed', error } };
    }
};
exports.WorkflowPublisher = WorkflowPublisher;
exports.WorkflowPublisher = WorkflowPublisher = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ProjectRepository, project_service_ee_1.ProjectService, workflow_service_1.WorkflowService, webhook_service_1.WebhookService])
], WorkflowPublisher);
function toPublishingContext(item, workflow) {
    return {
        status: item.action === 'create' ? 'created' : 'updated',
        sourcePublished: item.sourcePublished,
        currentlyPublished: !!workflow.activeVersionId,
        isArchived: workflow.isArchived,
    };
}
//# sourceMappingURL=workflow-publisher.js.map