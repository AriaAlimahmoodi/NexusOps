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
exports.WorkflowSuggestionRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const typeorm_1 = require("@n8n/typeorm");
const generate_nano_id_1 = require("@n8n/utils/generate-nano-id");
const workflow_suggestion_activity_entity_1 = require("./workflow-suggestion-activity.entity");
const workflow_suggestion_entity_1 = require("./workflow-suggestion.entity");
let WorkflowSuggestionRepository = class WorkflowSuggestionRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(workflow_suggestion_entity_1.WorkflowSuggestion, dataSource.manager, transactionRunner);
    }
    async getSuggestion(id, scope, ctx = {}) {
        const suggestion = await this.managerFor(ctx).findOneBy(workflow_suggestion_entity_1.WorkflowSuggestion, {
            id,
            workflowId: scope.workflowId,
            projectId: scope.projectId,
        });
        if (!suggestion)
            throw new errors_1.NotFoundError('Suggestion not found.');
        return suggestion;
    }
    async createPending(baseline, payload, ctx, resultKind) {
        const manager = this.managerFor(ctx);
        const suggestion = manager.create(workflow_suggestion_entity_1.WorkflowSuggestion, {
            workflowId: baseline.workflowId,
            projectId: baseline.projectId,
            backgroundUserId: baseline.backgroundUserId,
            expectedBaseline: baseline.expectedBaseline,
            state: 'pending',
            closedReason: null,
            closedAt: null,
            resultKind,
            appliedVersionId: null,
            appliedChecksum: null,
            appliedAction: null,
            appliedActorId: null,
            payload,
        });
        try {
            return await manager.save(suggestion);
        }
        catch (error) {
            if ((0, db_1.isUniqueConstraintError)(error))
                throw new errors_1.ConflictError('This workflow already has a pending proposal.');
            throw error;
        }
    }
    async appendSubmittedActivity(suggestionId, ctx) {
        const manager = this.managerFor(ctx);
        await manager.save(manager.create(workflow_suggestion_activity_entity_1.WorkflowSuggestionActivity, {
            suggestionId,
            action: 'submitted',
            author: 'assistant',
            actorId: null,
        }));
    }
    async appendActivity(suggestionId, action, actor, ctx) {
        const manager = this.managerFor(ctx);
        await manager
            .createQueryBuilder()
            .insert()
            .into(workflow_suggestion_activity_entity_1.WorkflowSuggestionActivity)
            .values({
            id: (0, generate_nano_id_1.generateNanoId)(),
            suggestionId,
            action,
            author: actor.author,
            actorId: actor.actorId,
        })
            .orIgnore()
            .execute();
    }
    async closePending(suggestion, reason, actor, ctx, appliedVersion = null) {
        const result = await this.managerFor(ctx).update(workflow_suggestion_entity_1.WorkflowSuggestion, { id: suggestion.id, state: 'pending' }, {
            state: 'closed',
            closedReason: reason,
            closedAt: new Date(),
            appliedVersionId: appliedVersion?.versionId ?? null,
            appliedChecksum: appliedVersion?.checksum ?? null,
            appliedAction: appliedVersion?.action ?? null,
            appliedActorId: appliedVersion?.actorId ?? null,
        });
        if (result.affected !== 1)
            return false;
        await this.appendActivity(suggestion.id, reason, actor, ctx);
        return true;
    }
    async getPendingForWorkflow(workflowId, ctx = {}) {
        return await this.managerFor(ctx).findOneBy(workflow_suggestion_entity_1.WorkflowSuggestion, {
            workflowId,
            state: 'pending',
        });
    }
    async getActivity(suggestionId) {
        return await this.managerFor({}).find(workflow_suggestion_activity_entity_1.WorkflowSuggestionActivity, {
            where: { suggestionId },
            order: { createdAt: 'ASC', id: 'ASC' },
        });
    }
};
exports.WorkflowSuggestionRepository = WorkflowSuggestionRepository;
exports.WorkflowSuggestionRepository = WorkflowSuggestionRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], WorkflowSuggestionRepository);
//# sourceMappingURL=workflow-suggestion.repository.js.map