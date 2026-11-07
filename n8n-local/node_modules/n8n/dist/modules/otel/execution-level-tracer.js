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
exports.ExecutionLevelTracer = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const api_1 = require("@opentelemetry/api");
const core_1 = require("@opentelemetry/core");
const workflow_crashed_error_1 = require("../../errors/workflow-crashed.error");
const execution_identity_1 = require("./execution-identity");
const execution_level_tracer_types_1 = require("./execution-level-tracer.types");
const otel_settings_service_1 = require("./otel-settings.service");
const otel_config_1 = require("./otel.config");
const otel_constants_1 = require("./otel.constants");
const otel_service_1 = require("./otel.service");
const TRACER_NAME = 'n8n-workflow';
const propagator = new core_1.W3CTraceContextPropagator();
const UNKNOWN_ERROR_TYPE = 'UnknownError';
const OBJECT_ERROR_TYPE = 'Object';
function isError(status) {
    return status === 'error' || status === 'crashed';
}
let ExecutionLevelTracer = class ExecutionLevelTracer {
    constructor(otelService, otelSettingsService, logger, customAttributesConfig) {
        this.otelService = otelService;
        this.otelSettingsService = otelSettingsService;
        this.logger = logger;
        this.customAttributesConfig = customAttributesConfig;
        this.activeWorkflowSpans = new Map();
        this.activeNodeSpansByExecutionId = new Map();
    }
    get tracer() {
        return this.otelService.getTracer(TRACER_NAME);
    }
    startWorkflow(params) {
        try {
            const identity = resolveWorkflowIdentity(params);
            const parentCtx = (0, execution_identity_1.withExecutionIdentity)(this.parseTraceParentHeaders(params.tracingContext), identity);
            const links = this.buildContinuationLinks(params.linkTo);
            const projectCustomAttributes = this.buildCustomAttributes('project', params.project?.customAttributes);
            const attributes = {
                ...projectCustomAttributes,
                ...this.buildCustomAttributes('workflow', params.workflow?.customAttributes),
                [otel_constants_1.ATTR.WORKFLOW_NAME]: params.workflow.name,
                [otel_constants_1.ATTR.WORKFLOW_VERSION_ID]: params.workflow.versionId ?? '',
                [otel_constants_1.ATTR.WORKFLOW_NODE_COUNT]: params.workflow.nodeCount,
                ...(params.project && { [otel_constants_1.ATTR.PROJECT_ID]: params.project.id }),
                ...identity,
            };
            const span = this.tracer.startSpan('workflow.execute', { attributes, links }, parentCtx);
            const workflowContext = api_1.trace.setSpan(parentCtx, span);
            this.activeWorkflowSpans.set(params.executionId, {
                span,
                context: workflowContext,
                projectCustomAttributes,
            });
            if (params.emitStartSpan) {
                this.emitStartMarker('workflow.execute.started', attributes, workflowContext, params.executionId);
            }
            return toTracingParentContext(span, identity);
        }
        catch (error) {
            this.logger.warn('Failed to start workflow span', {
                executionId: params.executionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    endWorkflow(params) {
        try {
            const tracked = this.activeWorkflowSpans.get(params.executionId);
            if (!tracked)
                return;
            const { span } = tracked;
            span.setAttributes({
                [otel_constants_1.ATTR.EXECUTION_MODE]: params.mode,
                [otel_constants_1.ATTR.EXECUTION_STATUS]: params.status,
                [otel_constants_1.ATTR.EXECUTION_IS_RETRY]: params.isRetry,
                ...(params.retryOf ? { [otel_constants_1.ATTR.EXECUTION_RETRY_OF]: params.retryOf } : {}),
            });
            span.setStatus({ code: isError(params.status) ? api_1.SpanStatusCode.ERROR : api_1.SpanStatusCode.OK });
            if (isError(params.status) && params.error) {
                span.setAttribute(otel_constants_1.ATTR.EXECUTION_ERROR_TYPE, getErrorType(params.error));
                const recordableException = toRecordableException(params.error);
                if (recordableException) {
                    span.recordException(recordableException);
                }
            }
            this.endDanglingNodeSpans(params.executionId);
            span.end();
        }
        catch (error) {
            this.logger.warn('Failed to end workflow span', {
                executionId: params.executionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
        finally {
            this.activeWorkflowSpans.delete(params.executionId);
        }
    }
    endCrashedWorkflow(params) {
        try {
            const tracked = this.activeWorkflowSpans.get(params.executionId);
            const span = tracked?.span ?? this.reconstructWorkflowSpan(params);
            span.setAttributes({
                [otel_constants_1.ATTR.EXECUTION_MODE]: params.mode,
                [otel_constants_1.ATTR.EXECUTION_STATUS]: 'crashed',
                [otel_constants_1.ATTR.EXECUTION_ERROR_TYPE]: workflow_crashed_error_1.WorkflowCrashedError.name,
                [otel_constants_1.ATTR.EXECUTION_CRASH_DETECTOR]: params.detector,
                [otel_constants_1.ATTR.EXECUTION_RECONSTRUCTED]: tracked === undefined,
                [otel_constants_1.ATTR.EXECUTION_IS_RETRY]: params.mode === 'retry',
                ...(params.retryOf ? { [otel_constants_1.ATTR.EXECUTION_RETRY_OF]: params.retryOf } : {}),
            });
            span.setStatus({ code: api_1.SpanStatusCode.ERROR });
            span.recordException(new workflow_crashed_error_1.WorkflowCrashedError());
            this.endDanglingNodeSpans(params.executionId, 'workflow_crashed');
            span.end(params.stoppedAt);
        }
        catch (error) {
            this.logger.warn('Failed to end crashed workflow span', {
                executionId: params.executionId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        finally {
            this.activeWorkflowSpans.delete(params.executionId);
        }
    }
    reconstructWorkflowSpan(params) {
        const identity = resolveCrashedWorkflowIdentity(params);
        return this.tracer.startSpan('workflow.execute', {
            startTime: params.startedAt,
            attributes: {
                ...this.buildCustomAttributes('project', params.project?.customAttributes),
                ...this.buildCustomAttributes('workflow', params.workflow?.customAttributes),
                ...(params.workflowName && { [otel_constants_1.ATTR.WORKFLOW_NAME]: params.workflowName }),
                ...(params.workflowVersionId && {
                    [otel_constants_1.ATTR.WORKFLOW_VERSION_ID]: params.workflowVersionId,
                }),
                ...(params.project?.id && { [otel_constants_1.ATTR.PROJECT_ID]: params.project.id }),
                ...identity,
            },
        }, (0, execution_identity_1.withExecutionIdentity)(this.parseTraceParentHeaders(params.tracingContext), identity));
    }
    startNode(params) {
        try {
            const tracked = this.activeWorkflowSpans.get(params.executionId);
            if (!tracked) {
                this.logger.warn('Trying to start a node without a pre-existing parent workflow trace - ignoring');
                return;
            }
            const attributes = {
                [otel_constants_1.ATTR.NODE_ID]: params.node.id,
                [otel_constants_1.ATTR.NODE_NAME]: params.node.name,
                [otel_constants_1.ATTR.NODE_TYPE]: params.node.type,
                [otel_constants_1.ATTR.NODE_TYPE_VERSION]: params.node.typeVersion,
                ...tracked.projectCustomAttributes,
            };
            const span = this.tracer.startSpan('node.execute', { attributes }, tracked.context);
            if (params.emitStartSpan) {
                this.emitStartMarker('node.execute.started', attributes, api_1.trace.setSpan(tracked.context, span), params.executionId);
            }
            let executionNodes = this.activeNodeSpansByExecutionId.get(params.executionId);
            if (!executionNodes) {
                executionNodes = new Map();
                this.activeNodeSpansByExecutionId.set(params.executionId, executionNodes);
            }
            executionNodes.set(params.node.name, { span });
        }
        catch (error) {
            this.logger.warn('Failed to start node span', {
                executionId: params.executionId,
                nodeName: params.node.name,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    endNode(params) {
        try {
            const executionNodes = this.activeNodeSpansByExecutionId.get(params.executionId);
            const nodeStart = executionNodes?.get(params.node.name);
            if (!nodeStart)
                return;
            const { span: activeNodeSpan } = nodeStart;
            activeNodeSpan.setAttributes({
                [otel_constants_1.ATTR.NODE_ITEMS_INPUT]: params.inputItemCount,
                [otel_constants_1.ATTR.NODE_ITEMS_OUTPUT]: params.outputItemCount,
                ...this.buildCustomAttributes('node', params.customAttributes),
            });
            if (params.error) {
                activeNodeSpan.setStatus({ code: api_1.SpanStatusCode.ERROR });
                const recordableException = toRecordableException(params.error);
                if (recordableException) {
                    activeNodeSpan.recordException(recordableException);
                }
            }
            else {
                activeNodeSpan.setStatus({ code: api_1.SpanStatusCode.OK });
            }
            activeNodeSpan.end();
            executionNodes?.delete(params.node.name);
        }
        catch (error) {
            this.logger.warn('Failed to end node span', {
                executionId: params.executionId,
                nodeName: params.node.name,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    getActiveContext(executionId, nodeName) {
        const span = this.findMostSpecificSpan(executionId, nodeName);
        return span ? api_1.trace.setSpan(api_1.context.active(), span) : undefined;
    }
    injectTraceHeaders(executionId, nodeName, headers) {
        try {
            if (!this.otelSettingsService.getSettings().injectOutbound)
                return;
            const span = this.findMostSpecificSpan(executionId, nodeName);
            if (!span)
                return;
            propagator.inject(api_1.trace.setSpan(api_1.ROOT_CONTEXT, span), headers, api_1.defaultTextMapSetter);
        }
        catch (error) {
            this.logger.warn('Failed to inject trace headers', {
                executionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    emitStartMarker(name, attributes, parentCtx, executionId) {
        try {
            const startTime = getStartTime(api_1.trace.getSpan(parentCtx));
            this.tracer.startSpan(name, { startTime, attributes }, parentCtx).end(startTime);
        }
        catch (error) {
            this.logger.warn('Failed to emit start marker span', {
                executionId,
                spanName: name,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    parseTraceParentHeaders(tracingContext) {
        if (!tracingContext)
            return api_1.ROOT_CONTEXT;
        return propagator.extract(api_1.ROOT_CONTEXT, tracingContext, api_1.defaultTextMapGetter);
    }
    buildContinuationLinks(linkTo) {
        if (!linkTo)
            return undefined;
        const extracted = propagator.extract(api_1.ROOT_CONTEXT, linkTo, api_1.defaultTextMapGetter);
        const spanContext = api_1.trace.getSpanContext(extracted);
        if (!spanContext)
            return undefined;
        return [
            {
                context: spanContext,
                attributes: { [otel_constants_1.ATTR.CONTINUATION_REASON]: 'resume' },
            },
        ];
    }
    findMostSpecificSpan(executionId, nodeName) {
        return ((nodeName
            ? this.activeNodeSpansByExecutionId.get(executionId)?.get(nodeName)?.span
            : undefined) ?? this.activeWorkflowSpans.get(executionId)?.span);
    }
    endDanglingNodeSpans(executionId, reason = 'workflow_cancelled') {
        const executionNodes = this.activeNodeSpansByExecutionId.get(executionId);
        if (!executionNodes)
            return;
        for (const tracked of executionNodes.values()) {
            terminateSpan(tracked.span, reason);
        }
        this.activeNodeSpansByExecutionId.delete(executionId);
    }
    buildCustomAttributes(level, attributes = {}) {
        const prefix = this.customAttributesConfig.prefixes[level];
        return Object.fromEntries(Object.entries(attributes)
            .map(([key, value]) => [`${prefix}${key}`, value])
            .filter(([key]) => !otel_constants_1.BUILT_IN_ATTRIBUTE_KEYS.has(key)));
    }
};
exports.ExecutionLevelTracer = ExecutionLevelTracer;
exports.ExecutionLevelTracer = ExecutionLevelTracer = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [otel_service_1.OtelService, otel_settings_service_1.OtelSettingsService, backend_common_1.Logger, otel_config_1.OtelCustomAttributesConfig])
], ExecutionLevelTracer);
function resolveWorkflowIdentity(params) {
    const saved = params.savedIdentity;
    return (0, execution_identity_1.buildExecutionIdentity)({
        executionId: params.executionId,
        workflowId: params.workflow.id,
        workflowName: params.workflow.name,
        projectId: params.project ? params.project.id : saved?.[otel_constants_1.ATTR.PROJECT_ID],
        projectName: params.project ? params.project.name : saved?.[otel_constants_1.ATTR.PROJECT_NAME],
    });
}
function resolveCrashedWorkflowIdentity(params) {
    return ((0, execution_identity_1.toExecutionIdentity)(params.tracingContext?.identity) ??
        (0, execution_identity_1.buildExecutionIdentity)({
            executionId: params.executionId,
            workflowId: params.workflowId,
            workflowName: params.workflowName,
            projectId: params.project?.id,
        }));
}
function toTracingParentContext(span, identity) {
    const carrier = {};
    propagator.inject(api_1.trace.setSpan(api_1.ROOT_CONTEXT, span), carrier, api_1.defaultTextMapSetter);
    return { traceparent: carrier.traceparent, tracestate: carrier.tracestate, identity };
}
function getStartTime(span) {
    const startTime = span && 'startTime' in span ? span.startTime : undefined;
    return (0, core_1.isTimeInputHrTime)(startTime) ? startTime : new Date();
}
function terminateSpan(span, reason) {
    span.setAttribute(otel_constants_1.ATTR.NODE_TERMINATION_REASON, reason);
    span.setStatus({ code: api_1.SpanStatusCode.ERROR });
    span.end();
}
function getErrorType(error) {
    if (error instanceof Error)
        return error.constructor.name;
    if (typeof error !== 'object' || error === null)
        return UNKNOWN_ERROR_TYPE;
    const record = error;
    const name = getNonEmptyString(record.name);
    if (name)
        return name;
    const constructorName = getConstructorName(record);
    if (constructorName && constructorName !== OBJECT_ERROR_TYPE)
        return constructorName;
    const description = getNonEmptyString(record.description);
    if (description && looksLikeErrorType(description))
        return description;
    return UNKNOWN_ERROR_TYPE;
}
function toRecordableException(error) {
    if (error instanceof Error || typeof error === 'string')
        return error;
    if ((0, execution_level_tracer_types_1.isEndNodeError)(error)) {
        return {
            message: error.message,
            name: getErrorType(error),
            stack: error.stack,
        };
    }
    return undefined;
}
function getNonEmptyString(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}
function getConstructorName(record) {
    const constructor = record.constructor;
    if (typeof constructor === 'function')
        return getNonEmptyString(constructor.name);
    if (typeof constructor !== 'object' || constructor === null)
        return undefined;
    return getNonEmptyString(constructor.name);
}
function looksLikeErrorType(value) {
    return /^[A-Z][\w.]*(Error|Exception)$/.test(value);
}
//# sourceMappingURL=execution-level-tracer.js.map