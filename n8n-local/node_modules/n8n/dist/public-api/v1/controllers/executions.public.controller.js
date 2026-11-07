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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionsPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const aborted_execution_retry_error_1 = require("../../../errors/aborted-execution-retry.error");
const missing_execution_stop_error_1 = require("../../../errors/missing-execution-stop.error");
const queued_execution_retry_error_1 = require("../../../errors/queued-execution-retry.error");
const errors_1 = require("@n8n/errors");
const execution_service_1 = require("../../../executions/execution.service");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
function isCursorObject(value) {
    return typeof value === 'object' && value !== null;
}
function resolveCursorPaging(cursor, queryLimit) {
    if (!cursor)
        return { limit: queryLimit };
    let decoded;
    try {
        decoded = (0, pagination_service_1.decodeCursor)(cursor);
    }
    catch {
        throw new errors_1.BadRequestError('An invalid cursor was provided');
    }
    if (!isCursorObject(decoded))
        throw new errors_1.BadRequestError('An invalid cursor was provided');
    const lastId = typeof decoded.lastId === 'string' || typeof decoded.lastId === 'number'
        ? String(decoded.lastId)
        : undefined;
    const limit = typeof decoded.limit === 'number' && Number.isInteger(decoded.limit)
        ?
            Math.min(Math.max(decoded.limit, 1), api_types_1.MAX_ITEMS_PER_PAGE)
        : queryLimit;
    return { lastId, limit };
}
let ExecutionsPublicController = class ExecutionsPublicController {
    constructor(executionService, workflowSharingService, executionRedactionServiceProxy, executionsConfig, eventService) {
        this.executionService = executionService;
        this.workflowSharingService = workflowSharingService;
        this.executionRedactionServiceProxy = executionRedactionServiceProxy;
        this.executionsConfig = executionsConfig;
        this.eventService = eventService;
    }
    async getExecutions(req, _res, query) {
        const { lastId, limit } = resolveCursorPaging(query.cursor, query.limit);
        const sharedWorkflowsIds = await this.workflowSharingService.getSharedWorkflowIdsForScopes(req.user, ['execution:read'], query.projectId);
        if (!sharedWorkflowsIds.length ||
            (query.workflowId && !sharedWorkflowsIds.includes(query.workflowId))) {
            return { data: [], nextCursor: null };
        }
        const { executions, count } = await this.executionService.findManyAndCount(query.workflowId ? [query.workflowId] : sharedWorkflowsIds, {
            status: query.status,
            limit,
            lastId,
            includeData: query.includeData,
            startedAfter: query.startedAfter,
            startedBefore: query.startedBefore,
            excludeRunning: query.status !== 'running',
            maxDataSizeBytes: query.ignoreDataSizeLimit ? 0 : this.executionsConfig.maxDisplaySize,
        });
        const newLastId = executions.length === 0 ? '0' : executions.at(-1).id;
        if (query.includeData) {
            const redactableExecutions = executions.filter(backend_services_1.isRedactableExecution);
            await this.executionRedactionServiceProxy.processExecutions(redactableExecutions, {
                user: req.user,
                redactExecutionData: query.redactExecutionData,
                ipAddress: req.ip ?? '',
                userAgent: req.headers['user-agent'] ?? '',
            });
        }
        this.eventService.emit('user-retrieved-all-executions', {
            userId: req.user.id,
            publicApi: true,
        });
        return toExecutionListPublicDto(executions, (0, pagination_service_1.encodeNextCursor)({ lastId: newLastId, limit, numberOfNextRecords: count }));
    }
    async getExecution(req, _res, executionId, query) {
        const sharedWorkflowsIds = await this.workflowSharingService.getSharedWorkflowIdsForScopes(req.user, ['execution:read']);
        if (!sharedWorkflowsIds.length) {
            throw new errors_1.NotFoundError('Not Found');
        }
        const maxDataSizeBytes = query.ignoreDataSizeLimit ? 0 : this.executionsConfig.maxDisplaySize;
        const execution = await this.executionService.findOneInWorkflows(executionId, sharedWorkflowsIds, {
            includeData: query.includeData,
            includeAnnotation: false,
            maxDataSizeBytes,
        });
        if (!execution) {
            throw new errors_1.NotFoundError('Not Found');
        }
        if (query.includeData && (0, backend_services_1.isRedactableExecution)(execution)) {
            await this.executionRedactionServiceProxy.processExecution(execution, {
                user: req.user,
                redactExecutionData: query.redactExecutionData,
                ipAddress: req.ip ?? '',
                userAgent: req.headers['user-agent'] ?? '',
            });
        }
        this.eventService.emit('user-retrieved-execution', {
            userId: req.user.id,
            publicApi: true,
        });
        return toExecutionPublicDto(execution);
    }
    async deleteExecution(req, _res, executionId) {
        const sharedWorkflowsIds = await this.workflowSharingService.getSharedWorkflowIdsForScopes(req.user, ['execution:delete']);
        if (!sharedWorkflowsIds.length) {
            throw new errors_1.NotFoundError('Not Found');
        }
        const execution = await this.executionService.deleteOne(executionId, sharedWorkflowsIds);
        return toDeletedExecutionPublicDto(execution, executionId);
    }
    async getExecutionTags(req, _res, executionId) {
        const sharedWorkflowsIds = await this.workflowSharingService.getSharedWorkflowIdsForScopes(req.user, ['workflow:read']);
        if (!sharedWorkflowsIds.length) {
            throw new errors_1.NotFoundError('Not Found');
        }
        const tags = await this.executionService.getExecutionTags(executionId, sharedWorkflowsIds);
        return tags.map(toPublicTag);
    }
    async updateExecutionTags(req, _res, executionId, body) {
        const sharedWorkflowsIds = await this.workflowSharingService.getSharedWorkflowIdsForScopes(req.user, ['workflow:update']);
        if (!sharedWorkflowsIds.length) {
            throw new errors_1.NotFoundError('Not Found');
        }
        const tags = await this.executionService.updateExecutionTags(executionId, body.map((tag) => tag.id), sharedWorkflowsIds);
        return tags.map(toPublicTag);
    }
    async stopManyExecutions(req, _res, body) {
        const status = body.status.map((value) => api_types_1.STOPPABLE_PUBLIC_TO_INTERNAL_STATUS[value]);
        const sharedWorkflowsIds = await this.workflowSharingService.getSharedWorkflowIdsForScopes(req.user, ['workflow:execute']);
        if (!sharedWorkflowsIds.length) {
            return { stopped: 0 };
        }
        const { workflowId } = body;
        if (workflowId && workflowId !== 'all' && !sharedWorkflowsIds.includes(workflowId)) {
            throw new errors_1.NotFoundError('Workflow not found or not accessible');
        }
        const stopped = await this.executionService.stopMany({
            workflowId: workflowId ?? 'all',
            status,
            startedAfter: body.startedAfter,
            startedBefore: body.startedBefore,
        }, sharedWorkflowsIds);
        return { stopped };
    }
    async stopExecution(req, _res, executionId) {
        const sharedWorkflowsIds = await this.workflowSharingService.getSharedWorkflowIdsForScopes(req.user, ['workflow:execute']);
        if (!sharedWorkflowsIds.length) {
            throw new errors_1.NotFoundError('Not Found');
        }
        try {
            const stopResult = await this.executionService.stop(executionId, sharedWorkflowsIds);
            return toStoppedExecutionPublicDto(stopResult);
        }
        catch (error) {
            if (error instanceof missing_execution_stop_error_1.MissingExecutionStopError) {
                throw new errors_1.NotFoundError(error.message);
            }
            if (error instanceof n8n_workflow_1.WorkflowOperationError) {
                throw new errors_1.ConflictError(error.message);
            }
            throw error;
        }
    }
    async retryExecution(req, _res, executionId, body) {
        const sharedWorkflowsIds = await this.workflowSharingService.getSharedWorkflowIdsForScopes(req.user, ['workflow:execute']);
        if (!sharedWorkflowsIds.length) {
            throw new errors_1.NotFoundError('Not Found');
        }
        try {
            const retriedExecution = await this.executionService.retry({
                executionId,
                options: { loadWorkflow: body.loadWorkflow },
                sharedWorkflowIds: sharedWorkflowsIds,
                user: req.user,
            });
            this.eventService.emit('user-retried-execution', {
                userId: req.user.id,
                publicApi: true,
            });
            return toRetriedExecutionPublicDto(retriedExecution);
        }
        catch (error) {
            if (error instanceof queued_execution_retry_error_1.QueuedExecutionRetryError ||
                error instanceof aborted_execution_retry_error_1.AbortedExecutionRetryError) {
                throw new errors_1.ConflictError(error.message);
            }
            throw error;
        }
    }
};
exports.ExecutionsPublicController = ExecutionsPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('execution:list'),
    (0, decorators_1.ApiSummary)('Retrieve all executions'),
    (0, decorators_1.ApiDescription)('Retrieve all executions from your instance.'),
    (0, decorators_1.ApiTags)(['Executions']),
    (0, decorators_1.ApiResponse)(200, api_types_1.ExecutionListPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListExecutionsQueryDto]),
    __metadata("design:returntype", Promise)
], ExecutionsPublicController.prototype, "getExecutions", null);
__decorate([
    (0, decorators_1.Get)('/:executionId'),
    (0, decorators_1.ApiKeyScope)('execution:read'),
    (0, decorators_1.ApiSummary)('Retrieve an execution'),
    (0, decorators_1.ApiDescription)('Retrieve an execution from your instance.'),
    (0, decorators_1.ApiTags)(['Executions']),
    (0, decorators_1.ApiResponse)(200, api_types_1.ExecutionPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('executionId', api_types_1.executionIdParamSchema)),
    __param(3, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.GetExecutionQueryDto]),
    __metadata("design:returntype", Promise)
], ExecutionsPublicController.prototype, "getExecution", null);
__decorate([
    (0, decorators_1.Delete)('/:executionId'),
    (0, decorators_1.ApiKeyScope)('execution:delete'),
    (0, decorators_1.ApiSummary)('Delete an execution'),
    (0, decorators_1.ApiDescription)('Deletes an execution from your instance.'),
    (0, decorators_1.ApiTags)(['Executions']),
    (0, decorators_1.ApiResponse)(200, api_types_1.DeletedExecutionPublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('executionId', api_types_1.executionIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ExecutionsPublicController.prototype, "deleteExecution", null);
__decorate([
    (0, decorators_1.Get)('/:executionId/tags'),
    (0, decorators_1.ApiKeyScope)('executionTags:list'),
    (0, decorators_1.ApiSummary)('Get execution tags'),
    (0, decorators_1.ApiDescription)('Get annotation tags for an execution.'),
    (0, decorators_1.ApiTags)(['Executions']),
    (0, decorators_1.ApiResponse)(200, api_types_1.ExecutionTagsPublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('executionId', api_types_1.executionIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ExecutionsPublicController.prototype, "getExecutionTags", null);
__decorate([
    (0, decorators_1.Put)('/:executionId/tags'),
    (0, decorators_1.ApiKeyScope)('executionTags:update'),
    (0, decorators_1.ApiSummary)('Update tags of an execution'),
    (0, decorators_1.ApiDescription)('Update annotation tags of an execution.'),
    (0, decorators_1.ApiTags)(['Executions']),
    (0, decorators_1.ApiResponse)(200, api_types_1.ExecutionTagsPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('executionId', api_types_1.executionIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.TagIdsPublicDto]),
    __metadata("design:returntype", Promise)
], ExecutionsPublicController.prototype, "updateExecutionTags", null);
__decorate([
    (0, decorators_1.Post)('/stop'),
    (0, decorators_1.ApiKeyScope)('execution:stop'),
    (0, decorators_1.ApiSummary)('Stop multiple executions'),
    (0, decorators_1.ApiDescription)('Stop multiple executions from your instance based on filter criteria.'),
    (0, decorators_1.ApiTags)(['Executions']),
    (0, decorators_1.ApiResponse)(200, api_types_1.StoppedExecutionsPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.StopManyExecutionsPublicDto]),
    __metadata("design:returntype", Promise)
], ExecutionsPublicController.prototype, "stopManyExecutions", null);
__decorate([
    (0, decorators_1.Post)('/:executionId/stop'),
    (0, decorators_1.ApiKeyScope)('execution:stop'),
    (0, decorators_1.ApiSummary)('Stop an execution'),
    (0, decorators_1.ApiDescription)('Stop an execution by id.'),
    (0, decorators_1.ApiTags)(['Executions']),
    (0, decorators_1.ApiResponse)(200, api_types_1.StoppedExecutionPublicDto),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('executionId', api_types_1.executionIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ExecutionsPublicController.prototype, "stopExecution", null);
__decorate([
    (0, decorators_1.Post)('/:executionId/retry'),
    (0, decorators_1.ApiKeyScope)('execution:retry'),
    (0, decorators_1.ApiSummary)('Retry an execution'),
    (0, decorators_1.ApiDescription)('Retry an execution from your instance.'),
    (0, decorators_1.ApiTags)(['Executions']),
    (0, decorators_1.ApiResponse)(200, api_types_1.RetriedExecutionPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('executionId', api_types_1.executionIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.RetryExecutionPublicDto]),
    __metadata("design:returntype", Promise)
], ExecutionsPublicController.prototype, "retryExecution", null);
exports.ExecutionsPublicController = ExecutionsPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/executions'),
    __metadata("design:paramtypes", [execution_service_1.ExecutionService, backend_services_1.WorkflowSharingService, backend_services_1.ExecutionRedactionServiceProxy, config_1.ExecutionsConfig, backend_services_1.EventService])
], ExecutionsPublicController);
function toPublicTracingContext(tracingContext) {
    if (!(0, is_record_1.isRecord)(tracingContext))
        return null;
    const { traceparent, tracestate } = tracingContext;
    if (typeof traceparent !== 'string' || traceparent.length === 0)
        return null;
    return typeof tracestate === 'string' ? { traceparent, tracestate } : { traceparent };
}
function toBaseFields(execution) {
    return {
        finished: execution.finished,
        mode: execution.mode,
        retryOf: execution.retryOf ?? null,
        retrySuccessId: execution.retrySuccessId ?? null,
        status: execution.status,
        createdAt: execution.createdAt.toISOString(),
        startedAt: execution.startedAt ? execution.startedAt.toISOString() : null,
        stoppedAt: execution.stoppedAt ? execution.stoppedAt.toISOString() : null,
        deletedAt: execution.deletedAt ? execution.deletedAt.toISOString() : null,
        workflowId: execution.workflowId,
        waitTill: execution.waitTill ? execution.waitTill.toISOString() : null,
        storedAt: execution.storedAt,
        tracingContext: toPublicTracingContext(execution.tracingContext),
        deduplicationKey: execution.deduplicationKey ?? null,
        jsonSizeBytes: execution.jsonSizeBytes ?? 0,
        binaryDataSizeBytes: execution.binaryDataSizeBytes ?? 0,
        workflowVersionId: execution.workflowVersionId ?? null,
        usedPrivateCredentials: execution.usedPrivateCredentials ?? false,
    };
}
function toExecutionListItem(execution) {
    return {
        id: execution.id,
        finished: execution.finished,
        mode: execution.mode,
        retryOf: execution.retryOf ?? null,
        retrySuccessId: execution.retrySuccessId ?? null,
        status: execution.status,
        startedAt: execution.startedAt ? execution.startedAt.toISOString() : null,
        stoppedAt: execution.stoppedAt ? execution.stoppedAt.toISOString() : null,
        workflowId: execution.workflowId,
        waitTill: execution.waitTill ? execution.waitTill.toISOString() : null,
        ...('storedAt' in execution && { storedAt: execution.storedAt }),
        ...('jsonSizeBytes' in execution && { jsonSizeBytes: execution.jsonSizeBytes }),
        ...('workflowVersionId' in execution && { workflowVersionId: execution.workflowVersionId }),
        ...('data' in execution && { data: execution.data }),
        ...('workflowData' in execution && { workflowData: execution.workflowData }),
        ...('customData' in execution && { customData: execution.customData }),
        ...('dataTooLargeToDisplay' in execution && {
            dataTooLargeToDisplay: execution.dataTooLargeToDisplay,
        }),
    };
}
function toExecutionListPublicDto(executions, nextCursor) {
    return (0, n8n_workflow_1.replaceCircularReferences)({
        data: executions.map(toExecutionListItem),
        nextCursor,
    });
}
function toExecutionPublicDto(execution) {
    return (0, n8n_workflow_1.replaceCircularReferences)({
        id: execution.id,
        ...toBaseFields(execution),
        data: execution.data,
        customData: execution.customData,
        workflowData: execution.workflowData,
        dataTooLargeToDisplay: execution.dataTooLargeToDisplay,
    });
}
function toDeletedExecutionPublicDto(execution, executionId) {
    return {
        id: Number(executionId),
        ...toBaseFields(execution),
    };
}
function toPublicTag(tag) {
    return {
        id: tag.id,
        name: tag.name,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
    };
}
function toStoppedExecutionPublicDto(stopResult) {
    return {
        mode: stopResult.mode,
        startedAt: stopResult.startedAt.toISOString(),
        stoppedAt: stopResult.stoppedAt?.toISOString(),
        finished: stopResult.finished,
        status: stopResult.status,
    };
}
function toRetriedExecutionPublicDto(retried) {
    return (0, n8n_workflow_1.replaceCircularReferences)({
        id: retried.id,
        mode: retried.mode,
        startedAt: retried.startedAt.toISOString(),
        workflowId: retried.workflowId,
        finished: retried.finished,
        retryOf: retried.retryOf ?? null,
        status: retried.status,
        waitTill: retried.waitTill instanceof Date ? retried.waitTill.toISOString() : retried.waitTill,
        data: retried.data,
        workflowData: retried.workflowData,
        customData: retried.customData,
        annotation: retried.annotation,
        storedAt: retried.storedAt,
    });
}
//# sourceMappingURL=executions.public.controller.js.map