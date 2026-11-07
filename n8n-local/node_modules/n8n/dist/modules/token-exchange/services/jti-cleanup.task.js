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
exports.JtiCleanupTask = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const token_exchange_jti_repository_1 = require("../database/repositories/token-exchange-jti.repository");
const token_exchange_config_1 = require("../token-exchange.config");
let JtiCleanupTask = class JtiCleanupTask {
    constructor(logger, config, jtiRepository) {
        this.config = config;
        this.jtiRepository = jtiRepository;
        this.name = 'jti-cleanup';
        this.schedule = (0, decorators_1.intervalFromSeconds)(this.config.jtiCleanupIntervalSeconds);
        this.target = (0, decorators_1.clusterTarget)({ scheduler: { retryOnFailure: true } });
        this.logger = logger.scoped('token-exchange');
    }
    async run(signal) {
        const batchSize = this.config.jtiCleanupBatchSize;
        let totalDeleted = 0;
        let deleted;
        do {
            deleted = await this.jtiRepository.deleteExpiredBatch(batchSize);
            totalDeleted += deleted;
        } while (deleted >= batchSize && !signal.aborted);
        if (totalDeleted > 0) {
            this.logger.debug('Cleaned up expired JTIs', { count: totalDeleted });
        }
    }
};
exports.JtiCleanupTask = JtiCleanupTask;
exports.JtiCleanupTask = JtiCleanupTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, token_exchange_config_1.TokenExchangeConfig, token_exchange_jti_repository_1.TokenExchangeJtiRepository])
], JtiCleanupTask);
//# sourceMappingURL=jti-cleanup.task.js.map