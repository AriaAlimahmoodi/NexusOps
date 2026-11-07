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
exports.PendingAuthorizationCleanupTask = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
let PendingAuthorizationCleanupTask = class PendingAuthorizationCleanupTask {
    constructor(logger, credentialsRepository) {
        this.logger = logger;
        this.credentialsRepository = credentialsRepository;
        this.name = 'pending-authorization-cleanup';
        this.schedule = {
            kind: 'interval',
            intervalSeconds: 1 * constants_1.Time.hours.toSeconds,
        };
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: { retryOnFailure: true },
            leaderTimer: {
                runOnTakeover: true,
            },
        });
        this.logger = this.logger.scoped('quick-connect');
    }
    async run() {
        const deleted = await this.credentialsRepository.deleteExpiredPendingAuthorizations(new Date());
        if (deleted > 0) {
            this.logger.debug(`Deleted ${deleted} credentials with expired pending authorization`);
        }
    }
};
exports.PendingAuthorizationCleanupTask = PendingAuthorizationCleanupTask;
exports.PendingAuthorizationCleanupTask = PendingAuthorizationCleanupTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.CredentialsRepository])
], PendingAuthorizationCleanupTask);
//# sourceMappingURL=pending-authorization-cleanup.task.js.map