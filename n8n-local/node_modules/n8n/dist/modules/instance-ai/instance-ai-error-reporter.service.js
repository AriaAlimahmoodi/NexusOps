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
exports.InstanceAiErrorReporterService = void 0;
exports.getAgentErrorSeverity = getAgentErrorSeverity;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const n8n_core_1 = require("n8n-core");
const observability_1 = require("./observability");
const stream_transport_error_1 = require("./stream-transport-error");
function getAgentErrorSeverity(source) {
    if (source === 'observer' || source === 'reflector' || source === 'episodic-memory') {
        return 'warning';
    }
    return undefined;
}
function isSelfDeclaredWarning(error) {
    if (typeof error !== 'object' || error === null || !('level' in error))
        return false;
    return error.level === 'warning' || error.level === 'info';
}
let InstanceAiErrorReporterService = class InstanceAiErrorReporterService {
    constructor(logger, errorReporter) {
        this.errorReporter = errorReporter;
        this.reportedErrorsByRun = new Map();
        this.logger = logger.scoped('instance-ai');
    }
    beginRun(runId) {
        const executionToken = Symbol('instance-ai-error-reporting-execution');
        this.reportedErrorsByRun.set(runId, { executionToken, reportedErrors: new WeakSet() });
        return executionToken;
    }
    endRun(runId, executionToken) {
        if (this.reportedErrorsByRun.get(runId)?.executionToken !== executionToken)
            return;
        this.reportedErrorsByRun.delete(runId);
    }
    endAllRuns() {
        this.reportedErrorsByRun.clear();
    }
    report(error, context) {
        if (this.shouldSkipDuplicateReport(error, context.runId))
            return;
        const observability = (0, observability_1.buildInstanceAiObservabilityContext)(context);
        if ((0, instance_ai_1.isQuotaExhaustedError)(error)) {
            this.logger.info(`Instance AI quota exhausted in ${context.component}`, {
                component: context.component,
                ...observability,
            });
            return;
        }
        if (context.providerStream && (0, stream_transport_error_1.isStreamTransportError)(error)) {
            this.logger.warn(`Instance AI stream transport failure in ${context.component}`, {
                error,
                component: context.component,
                ...observability,
            });
            return;
        }
        if (isSelfDeclaredWarning(error)) {
            this.logger.warn(`Instance AI warning-level error in ${context.component}`, {
                error,
                component: context.component,
                ...observability,
            });
            return;
        }
        const logDetails = { error, component: context.component, ...observability };
        if (context.severity === 'warning') {
            this.logger.warn(`Instance AI error in ${context.component}`, logDetails);
        }
        else {
            this.logger.error(`Instance AI error in ${context.component}`, logDetails);
        }
        this.errorReporter.error(error, {
            tags: { component: context.component, ...observability },
            extra: observability,
            ...(context.severity ? { level: context.severity } : {}),
            shouldIsolate: true,
        });
    }
    async withBoundary(component, context, fn) {
        try {
            return await fn();
        }
        catch (error) {
            this.report(error, { component, ...context });
            throw error;
        }
    }
    shouldSkipDuplicateReport(error, runId) {
        if (typeof error !== 'object' || error === null || !runId) {
            return false;
        }
        const runState = this.reportedErrorsByRun.get(runId);
        if (!runState) {
            return false;
        }
        if (runState.reportedErrors.has(error)) {
            return true;
        }
        runState.reportedErrors.add(error);
        return false;
    }
};
exports.InstanceAiErrorReporterService = InstanceAiErrorReporterService;
exports.InstanceAiErrorReporterService = InstanceAiErrorReporterService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter])
], InstanceAiErrorReporterService);
//# sourceMappingURL=instance-ai-error-reporter.service.js.map