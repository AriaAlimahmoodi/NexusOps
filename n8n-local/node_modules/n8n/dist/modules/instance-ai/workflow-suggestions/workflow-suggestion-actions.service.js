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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowSuggestionActionsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const n8n_workflow_1 = require("n8n-workflow");
const collaboration_service_1 = require("../../../collaboration/collaboration.service");
const check_access_1 = require("../../../permissions.ee/check-access");
const workflow_publication_status_service_1 = require("../../../workflows/publication/workflow-publication-status.service");
const workflow_service_1 = require("../../../workflows/workflow.service");
const workflow_suggestion_repository_1 = require("./database/workflow-suggestion.repository");
const workflow_suggestion_service_1 = require("./workflow-suggestion.service");
let WorkflowSuggestionActionsService = class WorkflowSuggestionActionsService {
    constructor(service, suggestions, workflows, collaboration, publication, txRunner, logger) {
        this.service = service;
        this.suggestions = suggestions;
        this.workflows = workflows;
        this.collaboration = collaboration;
        this.publication = publication;
        this.txRunner = txRunner;
        this.logger = logger;
    }
    async apply(actor, projectId, workflowId, suggestionId, clientId) {
        const user = await this.service.requireEditor(actor.id, workflowId);
        const newlyAppliedVersion = await this.applySuggestion(user, { workflowId, projectId }, suggestionId, 'apply', clientId);
        if (newlyAppliedVersion)
            await this.notifyEditors(workflowId, user.id);
        return await this.service.getProposal(user, projectId, workflowId, suggestionId);
    }
    async approveAndPublish(actor, projectId, workflowId, suggestionId, clientId) {
        const user = await this.service.requireEditor(actor.id, workflowId);
        if (!(await (0, check_access_1.userHasScopes)(user, ['workflow:publish'], false, { workflowId }))) {
            throw new errors_1.ForbiddenError('Workflow publish access is required.');
        }
        const newlyAppliedVersion = await this.applySuggestion(user, { workflowId, projectId }, suggestionId, 'approve-and-publish', clientId);
        let publishError;
        if (newlyAppliedVersion) {
            try {
                await this.publishAppliedVersion(user, workflowId, newlyAppliedVersion, clientId ?? suggestionId);
            }
            catch (error) {
                publishError = (0, ensure_error_1.ensureError)(error).message;
            }
            await this.notifyEditors(workflowId, user.id);
        }
        return {
            ...(await this.service.getProposal(user, projectId, workflowId, suggestionId)),
            ...(publishError !== undefined ? { publishError } : {}),
        };
    }
    async discard(actor, projectId, workflowId, suggestionId) {
        const outcome = await this.discardPending(actor, projectId, workflowId, suggestionId);
        if (outcome === 'unavailable')
            throw new errors_1.NotFoundError('Suggestion not found.');
        return await this.service.getProposal(actor, projectId, workflowId, suggestionId);
    }
    async discardPending(actor, projectId, workflowId, suggestionId, ctx = {}) {
        return await this.txRunner.run(ctx, async (ctx) => {
            const user = await this.service.requireEditor(actor.id, workflowId, ctx);
            const { suggestion, target } = await this.service.reconcilePending(suggestionId, { workflowId, projectId }, ctx);
            if (!target.workflow || target.projectId !== projectId)
                return 'unavailable';
            if (suggestion.state === 'pending') {
                const closed = await this.suggestions.closePending(suggestion, 'discarded', { author: 'human', actorId: user.id }, ctx);
                return closed ? 'discarded' : 'already_closed';
            }
            return 'already_closed';
        });
    }
    async applySuggestion(user, scope, suggestionId, action, clientId) {
        const { workflowId, projectId } = scope;
        const { suggestion, target } = await this.service.reconcilePending(suggestionId, scope);
        if (!target.workflow || target.projectId !== projectId)
            throw new errors_1.NotFoundError('Suggestion not found.');
        if (suggestion.state !== 'pending')
            return undefined;
        if (suggestion.resultKind !== 'fix_ready') {
            throw new errors_1.ConflictError('Only a Fix ready suggestion can be applied.');
        }
        await this.collaboration.validateWriteLock(user.id, clientId ?? suggestion.id, workflowId, 'update');
        const prepared = await this.workflows.prepareUpdate(user, Object.assign(new db_1.WorkflowEntity(), structuredClone(suggestion.payload.candidate)), workflowId, { expectedChecksum: suggestion.expectedBaseline.checksum, source: 'n8n-ai' });
        const { saved, appliedVersion } = await this.txRunner.run({}, async (ctx) => {
            await this.validatePreparedWorkflow(suggestion, prepared.workflow, ctx);
            await this.service.requireEditor(user.id, workflowId, ctx);
            const saved = await this.workflows.savePreparedUpdate(prepared, ctx, {
                propagateVersionHistoryErrors: true,
            });
            const appliedVersion = {
                versionId: saved.versionId,
                checksum: await (0, n8n_workflow_1.calculateWorkflowChecksum)(saved),
                action,
                actorId: user.id,
            };
            const closed = await this.suggestions.closePending(suggestion, 'applied', { author: 'human', actorId: user.id }, ctx, appliedVersion);
            if (!closed)
                throw new errors_1.ConflictError('The suggestion has already closed.');
            return { saved, appliedVersion };
        });
        try {
            await this.workflows.finishUpdate(prepared, saved);
        }
        catch (error) {
            this.logger.warn('Could not finish the workflow update after Apply committed', {
                suggestionId,
                error,
            });
        }
        return appliedVersion;
    }
    async validatePreparedWorkflow(suggestion, prepared, ctx) {
        const { workflowId, projectId } = suggestion;
        const target = await this.service.readWorkflowTargetForApply(workflowId, ctx);
        const current = await this.suggestions.getSuggestion(suggestion.id, { workflowId, projectId }, ctx);
        if (current.state !== 'pending' ||
            !target.workflow ||
            !(await this.service.matchesBaseline(current, target))) {
            throw new errors_1.ConflictError('The suggestion no longer matches the workflow.');
        }
        const status = await this.publication.getStatus(workflowId, ctx);
        if (status.status !== 'published' ||
            status.liveVersionId !== current.expectedBaseline.publishedVersionId) {
            throw new errors_1.ConflictError('The original workflow is no longer fully published.');
        }
        const reviewed = { ...current.payload.original, ...current.payload.candidate };
        if ((await (0, n8n_workflow_1.calculateWorkflowChecksum)(prepared)) !== (await (0, n8n_workflow_1.calculateWorkflowChecksum)(reviewed)) ||
            !(0, isEqual_1.default)(prepared.staticData, target.workflow.staticData) ||
            prepared.versionId === target.workflow.versionId) {
            throw new errors_1.ConflictError('Workflow save preparation changed the reviewed fix.');
        }
    }
    async publishAppliedVersion(user, workflowId, version, clientId) {
        const publisher = await this.service.requireEditor(user.id, workflowId);
        await this.collaboration.validateWriteLock(publisher.id, clientId, workflowId, 'publish');
        await this.workflows.activateWorkflow(publisher, workflowId, {
            versionId: version.versionId,
            expectedChecksum: version.checksum,
            source: 'n8n-ai',
        });
    }
    async notifyEditors(workflowId, userId) {
        try {
            await this.collaboration.broadcastWorkflowUpdate(workflowId, userId);
        }
        catch (error) {
            this.logger.warn('Could not notify editors about the applied suggestion', {
                workflowId,
                error,
            });
        }
    }
};
exports.WorkflowSuggestionActionsService = WorkflowSuggestionActionsService;
exports.WorkflowSuggestionActionsService = WorkflowSuggestionActionsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_suggestion_service_1.WorkflowSuggestionService, workflow_suggestion_repository_1.WorkflowSuggestionRepository, workflow_service_1.WorkflowService, collaboration_service_1.CollaborationService, workflow_publication_status_service_1.WorkflowPublicationStatusService, db_1.TransactionRunner, backend_common_1.Logger])
], WorkflowSuggestionActionsService);
//# sourceMappingURL=workflow-suggestion-actions.service.js.map