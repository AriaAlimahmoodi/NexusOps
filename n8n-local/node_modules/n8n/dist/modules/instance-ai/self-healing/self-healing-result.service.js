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
exports.SelfHealingResultService = void 0;
exports.getSelfHealingReviewState = getSelfHealingReviewState;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const zod_1 = require("zod");
const workflow_suggestion_actions_service_1 = require("../workflow-suggestions/workflow-suggestion-actions.service");
const workflow_suggestion_service_1 = require("../workflow-suggestions/workflow-suggestion.service");
const self_healing_result_repository_1 = require("./database/self-healing-result.repository");
const self_healing_execution_reference_service_1 = require("./self-healing-execution-reference.service");
const referenceSchema = zod_1.z.object({
    workflowId: zod_1.z.string().min(1).max(36),
    projectId: zod_1.z.string().min(1).max(36),
    backgroundUserId: zod_1.z.string().uuid(),
    executionId: zod_1.z.string().min(1).max(36),
    completedAt: zod_1.z
        .date()
        .optional()
        .default(() => new Date()),
});
function getSelfHealingReviewState(result, suggestion) {
    return result.dismissedAt ? 'dismissed' : (suggestion?.closedReason ?? 'open');
}
let SelfHealingResultService = class SelfHealingResultService {
    constructor(results, suggestions, actions, ownership, executionReferences, txRunner, users, roles) {
        this.results = results;
        this.suggestions = suggestions;
        this.actions = actions;
        this.ownership = ownership;
        this.executionReferences = executionReferences;
        this.txRunner = txRunner;
        this.users = users;
        this.roles = roles;
    }
    async getInboxAccess(userId) {
        const user = await this.users.findByIdWithRole(userId);
        if (!user || user.disabled) {
            throw new errors_1.ForbiddenError('Workflow edit access is required.');
        }
        const scopes = ['workflow:read', 'workflow:update'];
        const [projectRoles, workflowRoles] = await Promise.all([
            this.roles.rolesWithScope('project', scopes),
            this.roles.rolesWithScope('workflow', scopes),
        ]);
        return { user, globalScopes: scopes, projectRoles, workflowRoles };
    }
    async listForInbox(user, query) {
        const rows = await this.results.listForInbox(await this.getInboxAccess(user.id), query);
        return rows.map((row) => ({
            ...row,
            type: 'self_healing_result',
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            completedAt: row.completedAt.toISOString(),
        }));
    }
    async countForInbox(user) {
        return await this.results.countForInbox(await this.getInboxAccess(user.id));
    }
    async prepare(input) {
        const references = referenceSchema.parse(input);
        const content = api_types_1.selfHealingResultContentSchema.parse({
            outcome: input.outcome,
            summary: input.summary,
            report: input.report,
            usage: input.usage,
        });
        const prepared = input.suggestion;
        if ((content.outcome === 'fix_ready' && !prepared) ||
            (content.outcome === 'could_not_fix' && prepared)) {
            throw new errors_1.BadRequestError('The suggestion does not match the result outcome.');
        }
        if (prepared &&
            (prepared.resultKind !== content.outcome ||
                prepared.baseline.workflowId !== references.workflowId ||
                prepared.baseline.projectId !== references.projectId ||
                prepared.baseline.backgroundUserId !== references.backgroundUserId)) {
            throw new errors_1.BadRequestError('The suggestion does not belong to this result.');
        }
        const actor = await this.suggestions.requireEditor(references.backgroundUserId, references.workflowId);
        await this.executionReferences.validateReference(actor, references.workflowId, references.executionId);
        return { references, content, suggestion: prepared };
    }
    async complete(input) {
        const prepared = await this.prepare(input);
        const { references, content } = prepared;
        return await this.txRunner.run({}, async (ctx) => {
            await this.suggestions.requireEditor(references.backgroundUserId, references.workflowId, ctx);
            await this.requireCurrentProject(references.workflowId, references.projectId, ctx);
            const suggestion = prepared.suggestion
                ? await this.suggestions.createSuggestion(prepared.suggestion, ctx)
                : null;
            return await this.results.createResult({
                ...references,
                ...content,
                suggestionId: suggestion?.id ?? null,
            }, ctx);
        });
    }
    async getDetail(user, projectId, workflowId, resultId) {
        const authorized = await this.getResultForEditor(user, projectId, workflowId, resultId);
        const reviewer = authorized.reviewer;
        let result = authorized.result;
        await this.requireCurrentProject(workflowId, projectId);
        let suggestion = result.suggestionId
            ? await this.suggestions.getProposal(reviewer, projectId, workflowId, result.suggestionId)
            : null;
        if (suggestion) {
            result = await this.results.getResult(resultId, { projectId, workflowId });
            if (result.dismissedAt && suggestion.state === 'pending') {
                suggestion = await this.suggestions.getProposal(reviewer, projectId, workflowId, suggestion.suggestionId);
            }
        }
        const execution = await this.executionReferences.getReference(reviewer, workflowId, result.executionId);
        return this.toDetail(result, suggestion, execution);
    }
    toDetail(result, suggestion, execution) {
        return {
            resultId: result.id,
            workflowId: result.workflowId,
            projectId: result.projectId,
            backgroundUserId: result.backgroundUserId,
            outcome: result.outcome,
            summary: result.summary,
            report: result.report,
            usage: result.usage,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
            completedAt: result.completedAt.toISOString(),
            dismissedAt: result.dismissedAt?.toISOString() ?? null,
            dismissedById: result.dismissedById,
            reviewState: getSelfHealingReviewState(result, suggestion),
            suggestion,
            execution,
        };
    }
    async act(user, projectId, workflowId, resultId, action, clientId) {
        const { result, reviewer } = await this.getResultForEditor(user, projectId, workflowId, resultId);
        if (result.outcome !== 'fix_ready' || !result.suggestionId) {
            throw new errors_1.ConflictError("This fix isn't ready to apply. Review the report for next steps.");
        }
        const { publishError, ...suggestion } = action === 'approve-and-publish'
            ? await this.actions.approveAndPublish(reviewer, projectId, workflowId, result.suggestionId, clientId)
            : await this.actions.apply(reviewer, projectId, workflowId, result.suggestionId, clientId);
        const execution = await this.executionReferences.getReference(reviewer, workflowId, result.executionId);
        return {
            ...this.toDetail(result, suggestion, execution),
            ...(publishError !== undefined ? { publishError } : {}),
        };
    }
    async dismiss(user, projectId, workflowId, resultId) {
        const found = await this.txRunner.run({}, async (ctx) => {
            const { result, reviewer } = await this.getResultForEditor(user, projectId, workflowId, resultId, ctx);
            if (result.dismissedAt)
                return true;
            if (result.suggestionId) {
                const outcome = await this.actions.discardPending(reviewer, projectId, workflowId, result.suggestionId, ctx);
                if (outcome === 'unavailable')
                    return false;
                if (outcome === 'already_closed')
                    return true;
            }
            else {
                await this.requireCurrentProject(workflowId, projectId, ctx);
            }
            if (result.outcome !== 'fix_ready') {
                await this.results.dismissResult(result.id, user.id, ctx);
            }
            return true;
        });
        if (!found) {
            throw new errors_1.NotFoundError('This result is no longer available in this project. Refresh the page.');
        }
        return await this.getDetail(user, projectId, workflowId, resultId);
    }
    async getResultForEditor(user, projectId, workflowId, resultId, ctx = {}) {
        const reviewer = await this.suggestions.requireEditor(user.id, workflowId, ctx);
        const result = await this.results.getResult(resultId, { projectId, workflowId }, ctx);
        return { result, reviewer };
    }
    async requireCurrentProject(workflowId, projectId, ctx = {}) {
        const owner = await this.ownership.getWorkflowOwningProject(workflowId, ctx);
        if (owner?.id !== projectId) {
            throw new errors_1.NotFoundError('This result is no longer available in this project. Refresh the page.');
        }
    }
};
exports.SelfHealingResultService = SelfHealingResultService;
exports.SelfHealingResultService = SelfHealingResultService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [self_healing_result_repository_1.SelfHealingResultRepository, workflow_suggestion_service_1.WorkflowSuggestionService, workflow_suggestion_actions_service_1.WorkflowSuggestionActionsService, db_1.SharedWorkflowRepository, self_healing_execution_reference_service_1.SelfHealingExecutionReferenceService, db_1.TransactionRunner, db_1.UserRepository, backend_services_1.RoleService])
], SelfHealingResultService);
//# sourceMappingURL=self-healing-result.service.js.map