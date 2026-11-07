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
exports.OtelLifecycleHandler = void 0;
exports.countOutputItems = countOutputItems;
exports.countInputItems = countInputItems;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const execution_identity_1 = require("./execution-identity");
const execution_level_tracer_1 = require("./execution-level-tracer");
const otel_settings_service_1 = require("./otel-settings.service");
const otel_service_1 = require("./otel.service");
const tracing_context_1 = require("./tracing-context");
const ownership_service_1 = require("../../services/ownership.service");
const isCustomTelemetryTag = (value) => typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'key' in value &&
    'value' in value &&
    typeof value.key === 'string' &&
    typeof value.value === 'string';
const getCustomTelemetryTags = (value) => {
    if (Array.isArray(value))
        return value.filter(isCustomTelemetryTag);
    if (typeof value !== 'object' || value === null || !('tag' in value)) {
        return undefined;
    }
    const { tag } = value;
    return Array.isArray(tag) ? tag.filter(isCustomTelemetryTag) : undefined;
};
let OtelLifecycleHandler = class OtelLifecycleHandler {
    constructor(tracer, traceContextService, otelService, otelSettingsService, ownershipService, workflowRepository, logger, licenseState, eventService) {
        this.tracer = tracer;
        this.traceContextService = traceContextService;
        this.otelService = otelService;
        this.otelSettingsService = otelSettingsService;
        this.ownershipService = ownershipService;
        this.workflowRepository = workflowRepository;
        this.logger = logger;
        this.licenseState = licenseState;
        this.eventService = eventService;
    }
    init() {
        this.eventService.on('execution-crashed', async (event) => await this.onExecutionCrashed(event));
    }
    async onReloadOtelConfig() {
        await this.otelService.restart();
    }
    shouldTrace(ctx) {
        const { enabled, productionExecutionsOnly, includeNodeSpans } = this.otelSettingsService.getSettings();
        if (!enabled)
            return false;
        if (productionExecutionsOnly && ctx.mode === 'manual')
            return false;
        if ((ctx.type === 'nodeExecuteBefore' || ctx.type === 'nodeExecuteAfter') && !includeNodeSpans)
            return false;
        return true;
    }
    async onWorkflowStart(ctx) {
        if (!this.shouldTrace(ctx))
            return;
        const parentExecutionId = ctx.executionData?.parentExecution?.executionId;
        const tracingContext = parentExecutionId
            ?
                await this.traceContextService.get(parentExecutionId)
            :
                await this.traceContextService.get(ctx.executionId);
        const project = await this.ownershipService
            .getWorkflowProjectCached(ctx.workflow.id)
            .catch((error) => {
            this.logger.warn('Failed to fetch project for OTEL span', {
                workflowId: ctx.workflow.id,
                executionId: ctx.executionId,
                error: error instanceof Error ? error.message : String(error),
            });
            return undefined;
        });
        const savedIdentity = parentExecutionId
            ? undefined
            : (0, execution_identity_1.toExecutionIdentity)(tracingContext?.identity);
        const spanContext = this.tracer.startWorkflow({
            executionId: ctx.executionId,
            tracingContext,
            savedIdentity,
            emitStartSpan: this.otelSettingsService.getSettings().emitWorkflowStartSpan,
            project: this.buildProjectContext(project),
            workflow: {
                id: ctx.workflow.id,
                name: savedIdentity
                    ? await this.getCurrentWorkflowName(ctx.workflow, ctx.executionId)
                    : ctx.workflow.name,
                versionId: ctx.workflow.versionId,
                nodeCount: ctx.workflow.nodes.length,
                customAttributes: this.buildWorkflowCustomAttributes(ctx.workflow.settings?.customTelemetryTags),
            },
        });
        await this.traceContextService.persist(ctx.executionId, spanContext);
    }
    async onWorkflowResume(ctx) {
        if (!this.shouldTrace(ctx))
            return;
        const previousWorkflowExecution = await this.traceContextService.get(ctx.executionId);
        const project = await this.ownershipService
            .getWorkflowProjectCached(ctx.workflow.id)
            .catch((error) => {
            this.logger.warn('Failed to fetch project for OTEL span', {
                workflowId: ctx.workflow.id,
                executionId: ctx.executionId,
                error: error instanceof Error ? error.message : String(error),
            });
            return undefined;
        });
        const spanContext = this.tracer.startWorkflow({
            executionId: ctx.executionId,
            tracingContext: previousWorkflowExecution,
            linkTo: previousWorkflowExecution,
            savedIdentity: (0, execution_identity_1.toExecutionIdentity)(previousWorkflowExecution?.identity),
            emitStartSpan: this.otelSettingsService.getSettings().emitWorkflowStartSpan,
            project: this.buildProjectContext(project),
            workflow: {
                id: ctx.workflow.id,
                name: await this.getCurrentWorkflowName(ctx.workflow, ctx.executionId),
                versionId: ctx.workflow.versionId,
                nodeCount: ctx.workflow.nodes.length,
                customAttributes: this.buildWorkflowCustomAttributes(ctx.workflow.settings?.customTelemetryTags),
            },
        });
        await this.traceContextService.persist(ctx.executionId, spanContext);
    }
    onWorkflowEnd(ctx) {
        this.tracer.endWorkflow({
            executionId: ctx.executionId,
            status: ctx.runData.status,
            mode: ctx.runData.mode,
            error: ctx.runData.data.resultData.error,
            isRetry: ctx.runData.mode === 'retry',
            retryOf: ctx.retryOf,
        });
    }
    async onExecutionCrashed(event) {
        if (!this.shouldTrace({ type: 'executionCrashed', mode: event.mode }))
            return;
        this.tracer.endCrashedWorkflow({
            executionId: event.executionId,
            workflowId: event.workflowId,
            workflowName: event.workflowName,
            workflowVersionId: event.workflowVersionId,
            mode: event.mode,
            retryOf: event.retryOf,
            detector: event.detector,
            startedAt: event.startedAt,
            stoppedAt: event.stoppedAt,
            tracingContext: event.tracingContext,
            workflow: {
                customAttributes: this.buildWorkflowCustomAttributes(event.workflowCustomTelemetryTags),
            },
            project: event.project
                ? {
                    id: event.project.id,
                    customAttributes: this.buildProjectCustomAttributes(event.project.customTelemetryTags),
                }
                : undefined,
        });
    }
    onNodeStart(ctx) {
        if (!this.shouldTrace(ctx))
            return;
        const node = ctx.workflow.nodes.find((n) => n.name === ctx.nodeName);
        if (!node)
            return;
        this.tracer.startNode({
            executionId: ctx.executionId,
            node,
            emitStartSpan: this.otelSettingsService.getSettings().emitNodeStartSpan,
        });
    }
    onNodeEnd(ctx) {
        if (!this.shouldTrace(ctx))
            return;
        const node = ctx.workflow.nodes.find((n) => n.name === ctx.nodeName);
        if (!node)
            return;
        this.tracer.endNode({
            executionId: ctx.executionId,
            node,
            inputItemCount: countInputItems(ctx),
            outputItemCount: countOutputItems(ctx.taskData.data),
            error: ctx.taskData.error ?? undefined,
            customAttributes: this.buildNodeCustomAttributes(ctx),
        });
    }
    areCustomSpanAttributesLicensed() {
        return this.licenseState.isOtelCustomSpanAttributesLicensed();
    }
    buildWorkflowCustomAttributes(customTelemetryTags) {
        const tags = getCustomTelemetryTags(customTelemetryTags);
        if (!tags?.length)
            return;
        if (!this.areCustomSpanAttributesLicensed())
            return;
        const customAttributes = {};
        for (const { key, value } of tags) {
            const trimmedKey = key.trim();
            if (!trimmedKey)
                continue;
            customAttributes[trimmedKey] = value;
        }
        if (Object.keys(customAttributes).length === 0)
            return;
        return customAttributes;
    }
    async getCurrentWorkflowName(workflow, executionId) {
        try {
            const [current] = await this.workflowRepository.findByIds([workflow.id], {
                fields: ['name'],
            });
            return current?.name ?? workflow.name;
        }
        catch (error) {
            this.logger.warn('Failed to fetch workflow name for OTEL span', {
                workflowId: workflow.id,
                executionId,
                error: error instanceof Error ? error.message : String(error),
            });
            return workflow.name;
        }
    }
    buildProjectContext(project) {
        if (!project)
            return undefined;
        return {
            id: project.id,
            name: project.type === 'team' ? project.name : undefined,
            customAttributes: this.buildProjectCustomAttributes(project.customTelemetryTags),
        };
    }
    buildProjectCustomAttributes(tags) {
        if (!this.areCustomSpanAttributesLicensed())
            return undefined;
        if (!tags?.length)
            return undefined;
        const attrs = {};
        for (const { key, value } of tags) {
            attrs[key] = value;
        }
        return attrs;
    }
    buildNodeCustomAttributes(ctx) {
        if (!ctx.taskData.metadata?.tracing)
            return undefined;
        if (!this.areCustomSpanAttributesLicensed())
            return undefined;
        return Object.fromEntries(Object.entries(ctx.taskData.metadata.tracing).map(([key, value]) => [key, String(value)]));
    }
};
exports.OtelLifecycleHandler = OtelLifecycleHandler;
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-otel-config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OtelLifecycleHandler.prototype, "onReloadOtelConfig", null);
__decorate([
    (0, decorators_1.OnLifecycleEvent)('workflowExecuteBefore'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OtelLifecycleHandler.prototype, "onWorkflowStart", null);
__decorate([
    (0, decorators_1.OnLifecycleEvent)('workflowExecuteResume'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OtelLifecycleHandler.prototype, "onWorkflowResume", null);
__decorate([
    (0, decorators_1.OnLifecycleEvent)('workflowExecuteAfter'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OtelLifecycleHandler.prototype, "onWorkflowEnd", null);
__decorate([
    (0, decorators_1.OnLifecycleEvent)('nodeExecuteBefore'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OtelLifecycleHandler.prototype, "onNodeStart", null);
__decorate([
    (0, decorators_1.OnLifecycleEvent)('nodeExecuteAfter'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OtelLifecycleHandler.prototype, "onNodeEnd", null);
exports.OtelLifecycleHandler = OtelLifecycleHandler = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [execution_level_tracer_1.ExecutionLevelTracer, tracing_context_1.TraceContextService, otel_service_1.OtelService, otel_settings_service_1.OtelSettingsService, ownership_service_1.OwnershipService, db_1.WorkflowRepository, backend_common_1.Logger, backend_common_1.LicenseState, backend_services_1.EventService])
], OtelLifecycleHandler);
function countOutputItems(data) {
    if (!data?.main)
        return 0;
    return data.main.reduce((sum, branch) => sum + (branch?.length ?? 0), 0);
}
function countInputItems(ctx) {
    const runData = ctx.executionData.resultData.runData;
    let total = 0;
    for (const source of ctx.taskData.source) {
        if (!source)
            continue;
        const sourceRuns = runData[source.previousNode];
        if (!sourceRuns)
            continue;
        const run = sourceRuns[source.previousNodeRun ?? 0];
        if (!run?.data?.main)
            continue;
        const branch = run.data.main[source.previousNodeOutput ?? 0];
        total += branch?.length ?? 0;
    }
    return total;
}
//# sourceMappingURL=otel-lifecycle-handler.js.map