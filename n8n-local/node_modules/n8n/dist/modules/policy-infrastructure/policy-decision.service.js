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
exports.PolicyDecisionService = void 0;
exports.withDeadline = withDeadline;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const policy_check_failed_error_1 = require("./policy-check-failed.error");
const policy_decision_audit_1 = require("./policy-decision-audit");
const DEADLINES_MS = {
    workflowSave: 1_000,
    workflowPublish: 1_000,
    workflowStart: 250,
    workflowTransfer: 1_000,
    credentialSave: 1_000,
    credentialTransfer: 1_000,
    credentialDecrypt: 250,
    contentImport: 1_000,
};
async function withDeadline(start, ms) {
    const controller = new AbortController();
    let expired;
    let timer;
    try {
        return await Promise.race([
            start(controller.signal).then((result) => {
                if (expired)
                    throw expired;
                return result;
            }),
            new Promise((_, reject) => {
                timer = setTimeout(() => {
                    expired = new n8n_workflow_1.OperationalError(`Deadline of ${ms}ms exceeded`);
                    reject(expired);
                    controller.abort(expired);
                }, ms);
            }),
        ]);
    }
    finally {
        clearTimeout(timer);
    }
}
function mergeVersions(results) {
    const byScope = new Map();
    for (const { policyVersions = [] } of results) {
        for (const version of policyVersions)
            byScope.set(`${version.scope}:${version.version}`, version);
    }
    return [...byScope.values()];
}
function decisionFrom(results) {
    const violations = results.flatMap((result) => result.violations);
    const policyVersions = mergeVersions(results);
    return policyVersions.length > 0 ? { violations, policyVersions } : { violations };
}
let PolicyDecisionService = class PolicyDecisionService {
    constructor(logger, checkMetadata, eventService) {
        this.logger = logger;
        this.checkMetadata = checkMetadata;
        this.eventService = eventService;
        this.logger = this.logger.scoped('policy');
    }
    async enforce(point, context, actor) {
        const startedAt = Date.now();
        const { checkIds, results, failures } = await this.runChecks(point, context);
        const durationMs = Date.now() - startedAt;
        const decision = decisionFrom(results);
        if (failures.length > 0) {
            this.audit({ point, context, decision, durationMs, checkIds, failures }, actor);
            throw new policy_check_failed_error_1.PolicyCheckFailedError(point, failures.map((failure) => failure.correlationId));
        }
        if (decision.violations.length > 0) {
            this.audit({ point, context, decision, durationMs, checkIds }, actor);
        }
        return decision;
    }
    async evaluate(point, context) {
        const { results, failures } = await this.runChecks(point, context);
        const decision = decisionFrom(results);
        return failures.length > 0 ? { ...decision, checkErrors: failures } : decision;
    }
    hasChecksFor(point) {
        return this.runnersFor(point).length > 0;
    }
    audit(input, actor) {
        const line = (0, policy_decision_audit_1.decisionAudit)(input);
        const message = line.outcome === 'violation'
            ? `Policy blocked ${line.point}`
            : `Policy could not be verified for ${line.point}, so it was blocked`;
        this.logger.warn(message, line);
        this.eventService.emit('policy-decision-blocked', { ...line, ...(0, policy_decision_audit_1.auditedActor)(actor) });
    }
    async runChecks(point, context) {
        const runners = this.runnersFor(point);
        const outcomes = await Promise.all(runners.map(async ({ checkId, run }) => {
            try {
                const result = await withDeadline(async (signal) => await run(context, signal), DEADLINES_MS[point]);
                return { answered: true, result };
            }
            catch (error) {
                const correlationId = (0, node_crypto_1.randomUUID)();
                this.logger.error(`Policy check "${checkId}" failed at ${point}`, {
                    correlationId,
                    error,
                });
                return { answered: false, failure: { checkId, correlationId } };
            }
        }));
        const results = [];
        const failures = [];
        for (const outcome of outcomes) {
            if (outcome.answered)
                results.push(outcome.result);
            else
                failures.push(outcome.failure);
        }
        return { checkIds: runners.map((runner) => runner.checkId), results, failures };
    }
    runnersFor(point) {
        return this.checkMetadata.getClasses().flatMap((checkClass) => {
            const check = di_1.Container.get(checkClass);
            const run = check[decorators_1.ENFORCEMENT_POINT_METHODS[point]];
            return run ? [{ checkId: check.id, run: run.bind(check) }] : [];
        });
    }
};
exports.PolicyDecisionService = PolicyDecisionService;
exports.PolicyDecisionService = PolicyDecisionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, decorators_1.PolicyCheckMetadata, backend_services_1.EventService])
], PolicyDecisionService);
//# sourceMappingURL=policy-decision.service.js.map