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
exports.WorkflowReviewActivityService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const workflow_review_authorization_service_1 = require("./workflow-review-authorization.service");
const workflow_review_feature_gate_service_1 = require("./workflow-review-feature-gate.service");
const workflow_review_mapper_1 = require("./workflow-review.mapper");
let WorkflowReviewActivityService = class WorkflowReviewActivityService {
    constructor(featureGate, authorizationService, activityRepository, activityCommentRepository, requestRepository, userRepository, txRunner, logger, eventService) {
        this.featureGate = featureGate;
        this.authorizationService = authorizationService;
        this.activityRepository = activityRepository;
        this.activityCommentRepository = activityCommentRepository;
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.txRunner = txRunner;
        this.logger = logger;
        this.eventService = eventService;
    }
    async listActivity(user, workflowReviewRequestId, query) {
        await this.featureGate.assertAvailable();
        await this.authorizationService.findReadableRequestOrFail(user, workflowReviewRequestId);
        const { entries, hasMore } = await this.activityRepository.findFeedPage({
            workflowReviewRequestId,
            limit: query.limit,
            beforeId: query.cursor ? this.decodeCursor(query.cursor) : undefined,
        }, {});
        const oldest = entries.at(0);
        const nextCursor = hasMore && oldest ? this.encodeCursor(oldest.activity.id) : null;
        return { data: await this.hydrate(entries), nextCursor, hasMore };
    }
    async createComment(user, workflowReviewRequestId, dto) {
        await this.featureGate.assertAvailable();
        const access = await this.authorizationService.findReadableRequestOrFail(user, workflowReviewRequestId);
        const eligibility = await this.authorizationService.resolveViewerEligibility(user, access);
        if (!eligibility.canComment) {
            throw new errors_1.ForbiddenError('You are not allowed to comment on this review');
        }
        const { activity, message } = await this.txRunner.run({}, async (ctx) => {
            const request = await this.requestRepository.findById(workflowReviewRequestId, ctx);
            if (!request || request.state === 'closed') {
                throw new errors_1.ConflictError('The review request is no longer open');
            }
            const activity = await this.activityRepository.createActivity({
                workflowReviewRequestId,
                type: 'comment.created',
                data: null,
                createdById: user.id,
            }, ctx);
            const message = await this.activityCommentRepository.createComment({ activityId: activity.id, createdById: user.id, body: dto.body }, ctx);
            return { activity, message };
        });
        this.eventService.emit('workflow-review-comment-created', {
            user,
            workflowReviewRequestId,
        });
        return (0, workflow_review_mapper_1.toActivityEntry)(activity, [message], new Map([[user.id, (0, workflow_review_mapper_1.toEligibleReviewer)(user)]]), this.logger);
    }
    async hydrate(entries) {
        const usersById = await this.hydrateAuthors(entries.flatMap((entry) => [
            entry.activity.createdById,
            ...entry.messages.map((message) => message.createdById),
        ]));
        return entries.map((entry) => (0, workflow_review_mapper_1.toActivityEntry)(entry.activity, entry.messages, usersById, this.logger));
    }
    async hydrateAuthors(createdByIds) {
        const userIds = new Set(createdByIds.filter((id) => id !== null));
        if (userIds.size === 0) {
            return new Map();
        }
        const users = await this.userRepository.findManyByIds([...userIds]);
        return new Map(users.map((user) => [user.id, (0, workflow_review_mapper_1.toEligibleReviewer)(user)]));
    }
    encodeCursor(id) {
        return Buffer.from(String(id), 'utf8').toString('base64url');
    }
    decodeCursor(cursor) {
        const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
        if (!/^\d+$/.test(decoded)) {
            throw new errors_1.BadRequestError('Invalid pagination cursor');
        }
        const id = Number(decoded);
        if (!Number.isSafeInteger(id) || id <= 0) {
            throw new errors_1.BadRequestError('Invalid pagination cursor');
        }
        return id;
    }
};
exports.WorkflowReviewActivityService = WorkflowReviewActivityService;
exports.WorkflowReviewActivityService = WorkflowReviewActivityService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_review_feature_gate_service_1.WorkflowReviewFeatureGate, workflow_review_authorization_service_1.WorkflowReviewAuthorizationService, db_1.WorkflowReviewActivityRepository, db_1.WorkflowReviewActivityCommentRepository, db_1.WorkflowReviewRequestRepository, db_1.UserRepository, db_1.TransactionRunner, backend_common_1.Logger, backend_services_1.EventService])
], WorkflowReviewActivityService);
//# sourceMappingURL=workflow-review-activity.service.js.map