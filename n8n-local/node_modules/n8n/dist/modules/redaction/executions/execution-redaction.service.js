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
exports.ExecutionRedactionService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const credential_sharing_1 = require("../../../constants/credential-sharing");
const errors_1 = require("@n8n/errors");
const credentials_permission_checker_1 = require("../../../executions/pre-execution-checks/credentials-permission-checker");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const full_item_redaction_strategy_1 = require("./strategies/full-item-redaction.strategy");
const MANUAL_MODES = new Set(['manual']);
let ExecutionRedactionService = class ExecutionRedactionService {
    constructor(logger, licenseState, workflowFinderService, eventService, fullItemRedactionStrategy, credentialsPermissionChecker) {
        this.logger = logger;
        this.licenseState = licenseState;
        this.workflowFinderService = workflowFinderService;
        this.eventService = eventService;
        this.fullItemRedactionStrategy = fullItemRedactionStrategy;
        this.credentialsPermissionChecker = credentialsPermissionChecker;
    }
    async init() {
        this.logger.debug('Initializing ExecutionRedactionService...');
    }
    async processExecution(execution, options) {
        const executions = [execution];
        await this.processExecutions(executions, options);
        return executions[0];
    }
    async processExecutions(executions, options) {
        if (executions.length === 0)
            return;
        const processable = executions.filter((e) => e.data !== undefined && e.data !== null);
        if (processable.length === 0)
            return;
        const needsCheck = processable.filter((e) => !this.policyAllowsReveal(e));
        const uniqueWorkflowIds = [...new Set(needsCheck.map((e) => e.workflowId))];
        const [revealableIds, credentialInaccessibleExecutions] = await Promise.all([
            needsCheck.length > 0
                ? this.workflowFinderService.findWorkflowIdsWithScopeForUser(uniqueWorkflowIds, options.user, ['execution:reveal'])
                : Promise.resolve(new Set()),
            this.resolveCredentialInaccessibleExecutions(processable, options.user),
        ]);
        if (options.redactExecutionData === false) {
            for (const execution of processable) {
                if (this.hasDynamicCredentials(execution) &&
                    !this.isOwnDynamicCredentialsExecution(execution, options.user.id)) {
                    this.eventService.emit('execution-data-reveal-failure', {
                        user: options.user,
                        executionId: execution.id ?? '',
                        workflowId: execution.workflowId,
                        ipAddress: options.ipAddress ?? '',
                        userAgent: options.userAgent ?? '',
                        redactionPolicy: this.resolvePolicy(execution),
                        rejectionReason: 'Not the executing user of a private-credential execution',
                    });
                    throw new errors_1.ForbiddenError();
                }
                if (credentialInaccessibleExecutions.has(execution)) {
                    this.eventService.emit('execution-data-reveal-failure', {
                        user: options.user,
                        executionId: execution.id ?? '',
                        workflowId: execution.workflowId,
                        ipAddress: options.ipAddress ?? '',
                        userAgent: options.userAgent ?? '',
                        redactionPolicy: this.resolvePolicy(execution),
                        rejectionReason: 'User cannot use a credential referenced by this execution',
                    });
                    throw new errors_1.ForbiddenError();
                }
            }
            for (const execution of needsCheck) {
                if (this.hasDynamicCredentials(execution) &&
                    this.isOwnDynamicCredentialsExecution(execution, options.user.id)) {
                    continue;
                }
                if (!revealableIds.has(execution.workflowId)) {
                    this.eventService.emit('execution-data-reveal-failure', {
                        user: options.user,
                        executionId: execution.id ?? '',
                        workflowId: execution.workflowId,
                        ipAddress: options.ipAddress ?? '',
                        userAgent: options.userAgent ?? '',
                        redactionPolicy: this.resolvePolicy(execution),
                        rejectionReason: 'User lacks execution:reveal scope for this workflow',
                    });
                    throw new errors_1.ScopeForbiddenError("You do not have permission to reveal execution data. The 'execution:reveal' scope is required.", { errorCode: 'EXECUTION_REVEAL_FORBIDDEN', requiredScope: 'execution:reveal' }, 'Contact a project admin to request the required scope.');
                }
            }
        }
        for (let i = 0; i < executions.length; i++) {
            const execution = executions[i];
            if (execution.data === undefined || execution.data === null)
                continue;
            const hasDynCreds = this.hasDynamicCredentials(execution);
            const isOwnDynCreds = hasDynCreds && this.isOwnDynamicCredentialsExecution(execution, options.user.id);
            const policyAllowsReveal = this.policyAllowsReveal(execution);
            const inaccessibleCredentialIds = credentialInaccessibleExecutions.get(execution) ?? [];
            const enforceCredentialUsabilityRedaction = inaccessibleCredentialIds.length > 0;
            const userCanReveal = enforceCredentialUsabilityRedaction
                ? false
                : hasDynCreds
                    ? isOwnDynCreds
                    : policyAllowsReveal || revealableIds.has(execution.workflowId);
            const enforceDynCredRedaction = hasDynCreds && !isOwnDynCreds;
            const context = {
                user: options.user,
                redactExecutionData: options.redactExecutionData,
                userCanReveal,
                enforceDynCredRedaction,
                enforceCredentialUsabilityRedaction,
                inaccessibleCredentialIds,
                redactedBySubWorkflow: this.isRedactedBySubWorkflow(execution),
                memo: new Map(),
            };
            const pipeline = this.buildPipeline(execution, context, policyAllowsReveal);
            const needsCredentialStrip = hasDynCreds && execution.data.executionData?.runtimeData?.credentials !== undefined;
            let target = execution;
            if (options.keepOriginal) {
                const needsClone = needsCredentialStrip || pipeline.some((s) => s.requiresRedaction(execution, context));
                if (!needsClone)
                    continue;
                target = structuredClone(execution);
                executions[i] = target;
            }
            for (const strategy of pipeline) {
                await strategy.apply(target, context);
            }
            if (needsCredentialStrip && target.data.executionData?.runtimeData) {
                delete target.data.executionData.runtimeData.credentials;
            }
        }
        if (options.redactExecutionData === false) {
            for (const execution of processable) {
                this.eventService.emit('execution-data-revealed', {
                    user: options.user,
                    executionId: execution.id ?? '',
                    workflowId: execution.workflowId,
                    ipAddress: options.ipAddress ?? '',
                    userAgent: options.userAgent ?? '',
                    redactionPolicy: this.resolvePolicy(execution),
                });
            }
        }
    }
    buildPipeline(execution, context, policyAllowsReveal) {
        const pipeline = [];
        const policy = this.resolvePolicy(execution);
        const shouldClearItems = context.redactExecutionData !== false &&
            (context.redactExecutionData === true ||
                context.enforceDynCredRedaction ||
                context.enforceCredentialUsabilityRedaction ||
                (!policyAllowsReveal &&
                    (policy === 'all' ||
                        (policy === 'non-manual' && !MANUAL_MODES.has(execution.mode)) ||
                        (policy === 'manual-only' && MANUAL_MODES.has(execution.mode)))));
        if (shouldClearItems) {
            pipeline.push(this.fullItemRedactionStrategy);
        }
        return pipeline;
    }
    async resolveCredentialInaccessibleExecutions(executions, user) {
        if (!(0, credential_sharing_1.isCredSharingEnabled)())
            return new Map();
        const credentialIdsByExecution = new Map();
        const allCredentialIds = new Set();
        for (const execution of executions) {
            const credentialIds = [
                ...new Set([
                    ...this.credentialsPermissionChecker.getCredentialIdsForNodes(execution.workflowData.nodes),
                    ...(0, n8n_workflow_1.runDataUsedCredentialIds)(execution.data.resultData?.runData),
                ]),
            ];
            if (credentialIds.length === 0)
                continue;
            credentialIdsByExecution.set(execution, credentialIds);
            for (const id of credentialIds)
                allCredentialIds.add(id);
        }
        if (allCredentialIds.size === 0)
            return new Map();
        const inaccessibleIds = await this.credentialsPermissionChecker.resolveInaccessibleCredentialIdsForUser(user, [...allCredentialIds], { ignoreGlobalUseScope: true });
        if (inaccessibleIds.length === 0)
            return new Map();
        const inaccessibleIdSet = new Set(inaccessibleIds);
        const result = new Map();
        for (const [execution, credentialIds] of credentialIdsByExecution) {
            const inaccessible = credentialIds.filter((id) => inaccessibleIdSet.has(id));
            if (inaccessible.length > 0)
                result.set(execution, inaccessible);
        }
        return result;
    }
    hasDynamicCredentials(execution) {
        return ((0, n8n_workflow_1.runDataUsedDynamicCredentials)(execution.data.resultData?.runData) ||
            execution.data.executionData?.runtimeData?.usesDynamicCredentials === true);
    }
    isOwnDynamicCredentialsExecution(execution, userId) {
        return execution.data.executionData?.runtimeData?.executedByUserId === userId;
    }
    policyAllowsReveal(execution) {
        return this.policyAllowsMode(this.resolvePolicy(execution), execution.mode);
    }
    policyAllowsMode(policy, mode) {
        return (policy === 'none' ||
            (policy === 'non-manual' && MANUAL_MODES.has(mode)) ||
            (policy === 'manual-only' && !MANUAL_MODES.has(mode)));
    }
    isRedactedBySubWorkflow(execution) {
        if (!this.licenseState.isDataRedactionLicensed())
            return false;
        return (this.policyAllowsMode(this.resolveBasePolicy(execution), execution.mode) &&
            !this.policyAllowsMode(this.resolvePolicy(execution), execution.mode));
    }
    resolvePolicy(execution) {
        if (!this.licenseState.isDataRedactionLicensed())
            return 'none';
        const policy = this.resolveBasePolicy(execution);
        const reported = execution.data.executionData?.runtimeData?.subWorkflowRedaction;
        if (!reported?.production && !reported?.manual)
            return policy;
        return (0, n8n_workflow_1.channelsToPolicy)((0, n8n_workflow_1.mergeRedactionChannels)((0, n8n_workflow_1.policyToChannels)(policy), reported));
    }
    resolveBasePolicy(execution) {
        const redaction = execution.data.executionData?.runtimeData?.redaction;
        if (redaction?.version === 2) {
            return (0, n8n_workflow_1.channelsToPolicy)({ production: redaction.production, manual: redaction.manual });
        }
        return redaction?.policy ?? execution.workflowData.settings?.redactionPolicy ?? 'none';
    }
};
exports.ExecutionRedactionService = ExecutionRedactionService;
exports.ExecutionRedactionService = ExecutionRedactionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_common_1.LicenseState, workflow_finder_service_1.WorkflowFinderService, backend_services_1.EventService, full_item_redaction_strategy_1.FullItemRedactionStrategy, credentials_permission_checker_1.CredentialsPermissionChecker])
], ExecutionRedactionService);
//# sourceMappingURL=execution-redaction.service.js.map