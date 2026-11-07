"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toEligibleReviewer = toEligibleReviewer;
exports.toRequestSummary = toRequestSummary;
exports.toActivityEntry = toActivityEntry;
const api_types_1 = require("@n8n/api-types");
function toEligibleReviewer(user) {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
    };
}
function toRequestSummary(request, workflowVersionId) {
    return {
        id: request.id,
        state: request.state,
        decision: request.decision,
        workflowVersionId,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
    };
}
function parsePayload(schema, row, logger) {
    if (row.typeVersion === 1) {
        const parsed = schema.safeParse(row.data);
        if (parsed.success) {
            return parsed.data;
        }
    }
    logger.warn('Failed to parse workflow review activity payload', {
        activityId: row.id,
        type: row.type,
        typeVersion: row.typeVersion,
    });
    return null;
}
function toActivityEntry(row, messages, usersById, logger) {
    const createdBy = row.createdById ? (usersById.get(row.createdById) ?? null) : null;
    const base = {
        id: String(row.id),
        typeVersion: row.typeVersion,
        createdBy,
        createdAt: row.createdAt.toISOString(),
    };
    switch (row.type) {
        case 'comment.created':
            return {
                ...base,
                type: row.type,
                data: null,
                messages: messages.map((message) => ({
                    id: String(message.id),
                    body: message.deletedAt ? null : message.body,
                    createdBy: message.createdById ? (usersById.get(message.createdById) ?? null) : null,
                    createdAt: message.createdAt.toISOString(),
                    updatedAt: message.updatedAt?.toISOString() ?? null,
                    deletedAt: message.deletedAt?.toISOString() ?? null,
                })),
            };
        case 'review.opened':
            return {
                ...base,
                type: row.type,
                data: parsePayload(api_types_1.workflowReviewOpenedActivityDataSchema, row, logger),
            };
        case 'review.changes_requested':
        case 'review.approved':
            return {
                ...base,
                type: row.type,
                data: parsePayload(api_types_1.workflowReviewDecisionActivityDataSchema, row, logger),
            };
        case 'review.version_updated':
            return {
                ...base,
                type: row.type,
                data: parsePayload(api_types_1.workflowReviewVersionUpdatedActivityDataSchema, row, logger),
            };
        case 'review.closed':
            return {
                ...base,
                type: row.type,
                data: parsePayload(api_types_1.workflowReviewClosedActivityDataSchema, row, logger),
            };
        case 'workflow.archived':
        case 'workflow.deleted':
        case 'workflow.moved':
            return {
                ...base,
                type: row.type,
                data: parsePayload(api_types_1.workflowReviewWorkflowCauseActivityDataSchema, row, logger),
            };
        case 'workflow.published':
            return {
                ...base,
                type: row.type,
                data: parsePayload(api_types_1.workflowReviewWorkflowPublishedActivityDataSchema, row, logger),
            };
    }
    return { ...base, type: row.type, data: null };
}
//# sourceMappingURL=workflow-review.mapper.js.map