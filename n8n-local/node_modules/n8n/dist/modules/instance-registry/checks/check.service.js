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
exports.CheckService = void 0;
exports.computeDiff = computeDiff;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const message_event_bus_1 = require("../../../eventbus/message-event-bus/message-event-bus");
const push_1 = require("../../../push");
const instance_registry_service_1 = require("../instance-registry.service");
let CheckService = class CheckService {
    constructor(logger, instanceRegistryService, clusterCheckMetadata, messageEventBus, push) {
        this.instanceRegistryService = instanceRegistryService;
        this.clusterCheckMetadata = clusterCheckMetadata;
        this.messageEventBus = messageEventBus;
        this.push = push;
        this.checks = [];
        this.logger = logger.scoped('instance-registry');
    }
    init() {
        this.discoverChecks();
    }
    discoverChecks() {
        const checkClasses = this.clusterCheckMetadata.getClasses();
        for (const CheckClass of checkClasses) {
            try {
                const check = di_1.Container.get(CheckClass);
                this.checks.push(check);
            }
            catch (error) {
                this.logger.error(`Failed to instantiate cluster check "${CheckClass.name}"`, {
                    error,
                });
            }
        }
        this.logger.info(`Discovered ${this.checks.length} cluster checks`, {
            names: this.checks.map((c) => c.checkDescription.name),
        });
    }
    async runChecks() {
        if (this.checks.length === 0) {
            return { currentState: new Map(), results: [] };
        }
        const instances = await this.instanceRegistryService.getAllInstances();
        const previousState = await this.instanceRegistryService.getLastKnownState();
        return await this.evaluate(instances, previousState);
    }
    async evaluate(instances, previousState) {
        const currentState = new Map(instances.map((i) => [i.instanceKey, i]));
        const diff = computeDiff(previousState, currentState);
        const context = { currentState, previousState, diff };
        const settled = await Promise.allSettled(this.checks.map(async (check) => await check.run(context)));
        const results = [];
        for (let i = 0; i < settled.length; i++) {
            const outcome = settled[i];
            const check = this.checks[i];
            const checkResult = {
                checkName: check.checkDescription.name,
                checkDisplayName: check.checkDescription.displayName,
            };
            if (outcome.status === 'fulfilled') {
                checkResult.result = outcome.value;
            }
            else {
                this.logger.error('Cluster check failed', {
                    ...checkResult,
                    error: outcome.reason,
                });
                checkResult.failed = true;
            }
            results.push(checkResult);
        }
        return { currentState, results };
    }
    async reconcile(signal) {
        if (this.checks.length === 0)
            return;
        if (signal.aborted)
            return;
        const { instances, lastKnownState } = await this.instanceRegistryService.readClusterState();
        const { currentState, results } = await this.evaluate(instances, lastKnownState);
        if (signal.aborted)
            return;
        for (const { checkName, result } of results) {
            this.processResult(checkName, result);
        }
        if (signal.aborted)
            return;
        await this.instanceRegistryService.saveLastKnownState(currentState);
    }
    processResult(checkName, result) {
        for (const warning of result?.warnings ?? []) {
            this.logWarning(checkName, warning);
        }
        for (const event of result?.auditEvents ?? []) {
            this.emitAuditEvent(checkName, event);
        }
        for (const notification of result?.pushNotifications ?? []) {
            this.broadcastPush(checkName, notification);
        }
    }
    logWarning(checkName, warning) {
        const severity = warning.severity ?? 'warning';
        const method = severity === 'info' ? 'info' : severity === 'error' ? 'error' : 'warn';
        this.logger[method]('Cluster check warning', {
            check: checkName,
            code: warning.code,
            message: warning.message,
            context: warning.context,
        });
    }
    emitAuditEvent(checkName, event) {
        void this.messageEventBus
            .sendAuditEvent({
            eventName: event.eventName,
            payload: event.payload,
        })
            .catch((error) => {
            this.logger.warn('Failed to emit cluster check audit event', {
                check: checkName,
                eventName: event.eventName,
                error,
            });
        });
    }
    broadcastPush(checkName, notification) {
        try {
            this.push.broadcast({
                type: notification.type,
                data: notification.data,
            });
        }
        catch (error) {
            this.logger.warn('Failed to broadcast cluster check push notification', {
                check: checkName,
                type: notification.type,
                error,
            });
        }
    }
};
exports.CheckService = CheckService;
exports.CheckService = CheckService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, instance_registry_service_1.InstanceRegistryService, decorators_1.ClusterCheckMetadata, message_event_bus_1.MessageEventBus, push_1.Push])
], CheckService);
function computeDiff(previousState, currentState) {
    const added = [];
    const removed = [];
    const changed = [];
    for (const [key, current] of currentState) {
        const previous = previousState.get(key);
        if (!previous) {
            added.push(current);
        }
        else if (!isEquivalent(previous, current)) {
            changed.push({ previous, current });
        }
    }
    for (const [key, previous] of previousState) {
        if (!currentState.has(key))
            removed.push(previous);
    }
    return { added, removed, changed };
}
function isEquivalent(a, b) {
    return (a.schemaVersion === b.schemaVersion &&
        a.instanceKey === b.instanceKey &&
        a.hostId === b.hostId &&
        a.instanceType === b.instanceType &&
        a.instanceRole === b.instanceRole &&
        a.version === b.version);
}
//# sourceMappingURL=check.service.js.map