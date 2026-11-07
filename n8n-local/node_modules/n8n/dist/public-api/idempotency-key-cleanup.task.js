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
exports.IdempotencyKeyCleanupTask = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const idempotency_key_service_1 = require("../public-api/idempotency-key.service");
let IdempotencyKeyCleanupTask = class IdempotencyKeyCleanupTask {
    constructor(logger, idempotencyKeyService) {
        this.logger = logger;
        this.idempotencyKeyService = idempotencyKeyService;
        this.name = 'idempotency-key-cleanup';
        this.schedule = (0, decorators_1.intervalFromSeconds)(constants_1.Time.hours.toSeconds);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: { retryOnFailure: true },
            leaderTimer: {
                runOnTakeover: true,
            },
        });
        this.logger = this.logger.scoped('idempotency-key');
    }
    async run(signal) {
        const cutoff = new Date(Date.now() - db_1.IDEMPOTENCY_KEY_TTL_MS);
        const deleted = await this.idempotencyKeyService.deleteOlderThan(cutoff, signal);
        if (deleted > 0) {
            this.logger.debug('Cleaned up expired idempotency keys', { count: deleted });
        }
    }
};
exports.IdempotencyKeyCleanupTask = IdempotencyKeyCleanupTask;
exports.IdempotencyKeyCleanupTask = IdempotencyKeyCleanupTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, idempotency_key_service_1.IdempotencyKeyService])
], IdempotencyKeyCleanupTask);
//# sourceMappingURL=idempotency-key-cleanup.task.js.map