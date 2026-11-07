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
exports.WorkflowSuggestionService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const pick_1 = __importDefault(require("lodash/pick"));
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const workflow_helpers_1 = require("../../../workflow-helpers");
const workflow_publication_status_service_1 = require("../../../workflows/publication/workflow-publication-status.service");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const workflow_suggestion_repository_1 = require("./database/workflow-suggestion.repository");
const suggestionInputSchema = zod_1.z
    .object({
    graph: zod_1.z.object({ nodes: zod_1.z.array(zod_1.z.unknown()), connections: zod_1.z.record(zod_1.z.unknown()) }).strict(),
    explanation: zod_1.z.string().trim().min(1).max(20_000),
    resultKind: zod_1.z.enum(['fix_ready', 'needs_you']),
    errorContext: zod_1.z
        .object({
        summary: zod_1.z.string().max(4000),
        evidenceReference: zod_1.z.string().max(255).nullable(),
    })
        .strict()
        .nullable()
        .default(null),
})
    .strict();
let WorkflowSuggestionService = class WorkflowSuggestionService {
    constructor(suggestions, users, publication, txRunner, workflowFinder, workflowRepository, sharedWorkflowRepository, workflowPublishHistoryRepository) {
        this.suggestions = suggestions;
        this.users = users;
        this.publication = publication;
        this.txRunner = txRunner;
        this.workflowFinder = workflowFinder;
        this.workflowRepository = workflowRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.workflowPublishHistoryRepository = workflowPublishHistoryRepository;
    }
    async requireEditor(userId, workflowId, ctx = {}) {
        const { user } = await this.getEditorContext(userId, workflowId, ctx);
        return user;
    }
    async getEditorContext(userId, workflowId, ctx = {}) {
        const user = await this.users.findByIdWithRole(userId, ctx);
        if (!user || user.disabled) {
            throw new errors_1.ForbiddenError('Workflow edit access is required.');
        }
        const workflow = await this.workflowFinder.findWorkflowForUser(workflowId, user, ['workflow:read', 'workflow:update'], { ctx });
        if (!workflow)
            throw new errors_1.ForbiddenError('Workflow edit access is required.');
        return { user, workflow };
    }
    async isPublished(workflow, ctx) {
        if (workflow.isArchived ||
            !workflow.activeVersionId ||
            workflow.versionId !== workflow.activeVersionId)
            return false;
        const status = await this.publication.getStatus(workflow.id, ctx);
        return status.status === 'published' && status.liveVersionId === workflow.activeVersionId;
    }
    async captureBaseline(workflowId, backgroundUserId) {
        const { workflow } = await this.getEditorContext(backgroundUserId, workflowId);
        const projectId = workflow.shared.find(({ role }) => role === 'workflow:owner')?.projectId;
        if (!projectId || !(await this.isPublished(workflow, {}))) {
            throw new errors_1.ConflictError('The workflow must be fully published without saved changes.');
        }
        return {
            workflowId,
            projectId,
            backgroundUserId,
            expectedBaseline: {
                savedVersionId: workflow.versionId,
                publishedVersionId: workflow.versionId,
                checksum: await (0, n8n_workflow_1.calculateWorkflowChecksum)(workflow),
                versionCounter: workflow.versionCounter,
                latestPublishHistoryEventId: await this.workflowPublishHistoryRepository.getLatestPublishHistoryEventId(workflowId),
            },
            original: structuredClone((0, pick_1.default)(workflow, n8n_workflow_1.WORKFLOW_CHECKSUM_FIELDS)),
        };
    }
    async prepareSuggestion(baseline, input) {
        const { explanation, errorContext, resultKind } = suggestionInputSchema.parse(input);
        baseline = structuredClone(baseline);
        const { workflowId, backgroundUserId, expectedBaseline, original } = baseline;
        await this.requireEditor(backgroundUserId, workflowId);
        if ((await (0, n8n_workflow_1.calculateWorkflowChecksum)(original)) !== expectedBaseline.checksum) {
            throw new errors_1.ConflictError('The captured workflow baseline has changed.');
        }
        (0, workflow_helpers_1.validateWorkflowStructure)(input.graph);
        const graph = structuredClone(input.graph);
        if ((0, isEqual_1.default)(original.nodes, graph.nodes) && (0, isEqual_1.default)(original.connections, graph.connections)) {
            throw new errors_1.ConflictError('The suggestion has no workflow changes.');
        }
        return {
            baseline,
            resultKind,
            payload: {
                original,
                candidate: graph,
                explanation,
                errorContext,
            },
        };
    }
    async readWorkflowTarget(workflowId, ctx) {
        const workflow = await this.workflowRepository.findByIdInContext(workflowId, ctx);
        const ownerProject = await this.sharedWorkflowRepository.getWorkflowOwningProject(workflowId, ctx);
        const latestPublishHistoryEventId = await this.workflowPublishHistoryRepository.getLatestPublishHistoryEventId(workflowId, ctx);
        return { workflow, projectId: ownerProject?.id, latestPublishHistoryEventId };
    }
    async readWorkflowTargetForApply(workflowId, ctx) {
        const workflow = await this.workflowRepository.findForContentUpdate(workflowId, ctx);
        const ownerProject = await this.sharedWorkflowRepository.getWorkflowOwningProject(workflowId, ctx);
        const latestPublishHistoryEventId = await this.workflowPublishHistoryRepository.getLatestPublishHistoryEventId(workflowId, ctx);
        return { workflow, projectId: ownerProject?.id, latestPublishHistoryEventId };
    }
    async createSuggestion(prepared, ctx = {}) {
        const { baseline, payload } = prepared;
        const { workflowId } = baseline;
        return await this.txRunner.run(ctx, async (ctx) => {
            const target = await this.readWorkflowTarget(workflowId, ctx);
            if (!target.workflow ||
                !(await this.matchesBaseline(baseline, target)) ||
                !(await this.isPublished(target.workflow, ctx))) {
                throw new errors_1.ConflictError('The workflow no longer matches the published baseline.');
            }
            const previous = await this.suggestions.getPendingForWorkflow(workflowId, ctx);
            if (previous)
                await this.closeIfOutdated(previous, target, ctx);
            const suggestion = await this.suggestions.createPending(baseline, payload, ctx, prepared.resultKind);
            await this.suggestions.appendSubmittedActivity(suggestion.id, ctx);
            return suggestion;
        });
    }
    async matchesBaseline(baseline, { workflow, projectId, latestPublishHistoryEventId }) {
        const expected = baseline.expectedBaseline;
        return (!!workflow &&
            projectId === baseline.projectId &&
            !workflow.isArchived &&
            workflow.versionId === expected.savedVersionId &&
            workflow.activeVersionId === expected.publishedVersionId &&
            expected.latestPublishHistoryEventId === latestPublishHistoryEventId &&
            workflow.versionCounter === expected.versionCounter &&
            (await (0, n8n_workflow_1.calculateWorkflowChecksum)(workflow)) === expected.checksum);
    }
    async reconcilePending(suggestionId, scope, ctx = {}) {
        return await this.txRunner.run(ctx, async (ctx) => {
            const target = await this.readWorkflowTarget(scope.workflowId, ctx);
            const suggestion = await this.suggestions.getSuggestion(suggestionId, scope, ctx);
            return { suggestion: await this.closeIfOutdated(suggestion, target, ctx), target };
        });
    }
    async closeIfOutdated(suggestion, target, ctx) {
        if (suggestion.state !== 'pending' || (await this.matchesBaseline(suggestion, target))) {
            return suggestion;
        }
        await this.suggestions.closePending(suggestion, 'outdated', { author: 'system', actorId: null }, ctx);
        return await this.suggestions.getSuggestion(suggestion.id, suggestion, ctx);
    }
    async reconcileWorkflow(workflowId) {
        const pending = await this.suggestions.getPendingForWorkflow(workflowId);
        if (pending)
            await this.reconcilePending(pending.id, { workflowId, projectId: pending.projectId });
    }
    async requireProposalAccess(viewer, projectId, workflowId) {
        const { workflow } = await this.getEditorContext(viewer.id, workflowId);
        if (workflow.shared.find(({ role }) => role === 'workflow:owner')?.projectId !== projectId) {
            throw new errors_1.NotFoundError('Proposal not found.');
        }
    }
    async getProposal(viewer, projectId, workflowId, suggestionId) {
        await this.requireProposalAccess(viewer, projectId, workflowId);
        const suggestion = await this.suggestions.getSuggestion(suggestionId, {
            workflowId,
            projectId,
        });
        const activity = await this.suggestions.getActivity(suggestionId);
        const { appliedVersionId, appliedChecksum, appliedAction, appliedActorId } = suggestion;
        return {
            suggestionId,
            workflowId: suggestion.workflowId,
            projectId,
            backgroundUserId: suggestion.backgroundUserId,
            expectedBaseline: suggestion.expectedBaseline,
            state: suggestion.state,
            closedReason: suggestion.closedReason,
            resultKind: suggestion.resultKind,
            appliedVersion: appliedVersionId && appliedChecksum && appliedAction && appliedActorId
                ? {
                    versionId: appliedVersionId,
                    checksum: appliedChecksum,
                    action: appliedAction,
                    actorId: appliedActorId,
                }
                : null,
            author: 'assistant',
            payload: {
                ...suggestion.payload,
                proposed: { ...suggestion.payload.original, ...suggestion.payload.candidate },
            },
            activity: activity.map(({ id, action, author, actorId, createdAt }) => ({
                id,
                action,
                author,
                actorId: actorId ?? null,
                createdAt: createdAt.toISOString(),
            })),
        };
    }
};
exports.WorkflowSuggestionService = WorkflowSuggestionService;
exports.WorkflowSuggestionService = WorkflowSuggestionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_suggestion_repository_1.WorkflowSuggestionRepository, db_1.UserRepository, workflow_publication_status_service_1.WorkflowPublicationStatusService, db_1.TransactionRunner, workflow_finder_service_1.WorkflowFinderService, db_1.WorkflowRepository, db_1.SharedWorkflowRepository, db_1.WorkflowPublishHistoryRepository])
], WorkflowSuggestionService);
//# sourceMappingURL=workflow-suggestion.service.js.map