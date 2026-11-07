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
exports.TypeAvailabilityPolicySnapshot = exports.FINGERPRINT_POLL_INTERVAL_MS = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const type_availability_policy_attachment_repository_1 = require("./database/repositories/type-availability-policy-attachment.repository");
const type_availability_policy_scope_repository_1 = require("./database/repositories/type-availability-policy-scope.repository");
const effective_policy_1 = require("./effective-policy");
exports.FINGERPRINT_POLL_INTERVAL_MS = 30 * constants_1.Time.seconds.toMilliseconds;
function scopeKey(kind, projectId) {
    return `${kind}:${projectId ?? 'instance'}`;
}
function sameFingerprint(a, b) {
    return (a.count === b.count && a.versionSum === b.versionSum && a.newestCreatedAt === b.newestCreatedAt);
}
let TypeAvailabilityPolicySnapshot = class TypeAvailabilityPolicySnapshot {
    constructor(scopeRepository, attachmentRepository, publisher, logger) {
        this.scopeRepository = scopeRepository;
        this.attachmentRepository = attachmentRepository;
        this.publisher = publisher;
        this.logger = logger;
        this.loaded = null;
        this.queue = Promise.resolve();
        this.pending = null;
        this.polling = false;
        this.logger = this.logger.scoped('policy');
    }
    read(kind, projectId) {
        if (!this.loaded)
            return null;
        return this.loaded.scopes.get(scopeKey(kind, projectId)) ?? (0, effective_policy_1.unconfiguredScope)(kind, projectId);
    }
    projectScopes(kind) {
        if (!this.loaded)
            return null;
        return [...this.loaded.scopes.values()].filter((scope) => scope.kind === kind && scope.projectId !== null);
    }
    async start() {
        await this.reloadAndLog();
        this.pollTimer ??= setInterval(async () => await this.poll(), exports.FINGERPRINT_POLL_INTERVAL_MS);
        this.pollTimer.unref();
    }
    stop() {
        clearInterval(this.pollTimer);
        this.pollTimer = undefined;
    }
    async refreshAfterWrite() {
        await this.reloadAndLog();
        void this.publisher
            .publishCommand({ command: 'reload-type-availability-policies' })
            .catch((error) => {
            this.logger.warn('Failed to tell other processes to reload type availability policies', {
                error,
            });
        });
    }
    async handleReloadRequest() {
        await this.reloadAndLog();
    }
    async reload() {
        this.pending ??= this.queue.then(async () => {
            this.pending = null;
            await this.load();
        });
        const pending = this.pending;
        this.queue = pending.catch(() => { });
        await pending;
    }
    async reloadAndLog() {
        try {
            await this.reload();
        }
        catch (error) {
            this.logger.error('Failed to load type availability policies', { error });
        }
    }
    async load() {
        const fingerprint = await this.scopeRepository.readFingerprint({});
        const scopes = await this.scopeRepository.findAllScopes({});
        const attachmentsByScope = await this.attachmentRepository.listAttachmentsForScopes(scopes.map((scope) => scope.id), {});
        const byKey = new Map();
        for (const scope of scopes) {
            byKey.set(scopeKey(scope.kind, scope.projectId), (0, effective_policy_1.toEffectivePolicy)(scope, attachmentsByScope.get(scope.id) ?? []));
        }
        this.loaded = { scopes: byKey, fingerprint };
    }
    async poll() {
        if (this.polling)
            return;
        this.polling = true;
        try {
            if (this.loaded) {
                const fingerprint = await this.scopeRepository.readFingerprint({});
                if (sameFingerprint(fingerprint, this.loaded.fingerprint))
                    return;
                this.logger.info('Type availability policies changed without a reload message');
            }
            await this.reload();
        }
        catch (error) {
            this.logger.error('Failed to check type availability policies for changes', { error });
        }
        finally {
            this.polling = false;
        }
    }
};
exports.TypeAvailabilityPolicySnapshot = TypeAvailabilityPolicySnapshot;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TypeAvailabilityPolicySnapshot.prototype, "stop", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('reload-type-availability-policies'),
    (0, decorators_1.OnPubSubEvent)('pubsub-reconnected'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TypeAvailabilityPolicySnapshot.prototype, "handleReloadRequest", null);
exports.TypeAvailabilityPolicySnapshot = TypeAvailabilityPolicySnapshot = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [type_availability_policy_scope_repository_1.TypeAvailabilityPolicyScopeRepository, type_availability_policy_attachment_repository_1.TypeAvailabilityPolicyAttachmentRepository, publisher_service_1.Publisher, backend_common_1.Logger])
], TypeAvailabilityPolicySnapshot);
//# sourceMappingURL=type-availability-policy-snapshot.js.map