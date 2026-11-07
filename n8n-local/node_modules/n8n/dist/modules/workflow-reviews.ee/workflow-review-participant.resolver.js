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
exports.WorkflowReviewParticipantResolver = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const workflow_review_mapper_1 = require("./workflow-review.mapper");
let WorkflowReviewParticipantResolver = class WorkflowReviewParticipantResolver {
    constructor(workflowReviewRequestReviewerRepository, workflowReviewRequestAuthorRepository, userRepository) {
        this.workflowReviewRequestReviewerRepository = workflowReviewRequestReviewerRepository;
        this.workflowReviewRequestAuthorRepository = workflowReviewRequestAuthorRepository;
        this.userRepository = userRepository;
    }
    async resolve(requests) {
        const requestIds = requests.map((request) => request.id);
        const [reviewerRows, authorRows] = await Promise.all([
            this.workflowReviewRequestReviewerRepository.findByRequestIds(requestIds),
            this.workflowReviewRequestAuthorRepository.findByRequestIds(requestIds),
        ]);
        const reviewerIdsByRequestId = groupUserIdsByRequestId(reviewerRows);
        const authorIdsByRequestId = groupUserIdsByRequestId(authorRows);
        const userIds = new Set([
            ...requests.map((request) => request.createdById).filter((id) => id !== null),
            ...reviewerRows.map((row) => row.userId),
            ...authorRows.map((row) => row.userId),
        ]);
        const usersById = new Map();
        if (userIds.size > 0) {
            for (const user of await this.userRepository.findManyByIds([...userIds])) {
                usersById.set(user.id, (0, workflow_review_mapper_1.toEligibleReviewer)(user));
            }
        }
        const project = (userIdsForRequest) => userIdsForRequest.map((userId) => usersById.get(userId)).filter((user) => user !== undefined);
        const participantsByRequestId = new Map(requests.map((request) => [
            request.id,
            {
                requester: request.createdById ? (usersById.get(request.createdById) ?? null) : null,
                authors: project(authorIdsByRequestId.get(request.id) ?? []),
                reviewers: project(reviewerIdsByRequestId.get(request.id) ?? []),
            },
        ]));
        return {
            for: (requestId) => participantsByRequestId.get(requestId) ?? { requester: null, authors: [], reviewers: [] },
        };
    }
};
exports.WorkflowReviewParticipantResolver = WorkflowReviewParticipantResolver;
exports.WorkflowReviewParticipantResolver = WorkflowReviewParticipantResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowReviewRequestReviewerRepository, db_1.WorkflowReviewRequestAuthorRepository, db_1.UserRepository])
], WorkflowReviewParticipantResolver);
function groupUserIdsByRequestId(rows) {
    const idsByRequestId = new Map();
    for (const { workflowReviewRequestId, userId } of rows) {
        const ids = idsByRequestId.get(workflowReviewRequestId) ?? [];
        ids.push(userId);
        idsByRequestId.set(workflowReviewRequestId, ids);
    }
    return idsByRequestId;
}
//# sourceMappingURL=workflow-review-participant.resolver.js.map