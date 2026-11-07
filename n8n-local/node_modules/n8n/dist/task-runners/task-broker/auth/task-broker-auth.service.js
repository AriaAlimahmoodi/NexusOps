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
exports.TaskBrokerAuthService = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const crypto_1 = require("crypto");
const backend_services_1 = require("@n8n/backend-services");
const NO_BOUND_RUNNER = '-';
let TaskBrokerAuthService = class TaskBrokerAuthService {
    get grantTokenTtlInMs() {
        return this.runnersConfig.grantTokenTtl * constants_1.Time.seconds.toMilliseconds;
    }
    constructor(runnersConfig, cacheService) {
        this.runnersConfig = runnersConfig;
        this.cacheService = cacheService;
        this.authToken = Buffer.from(this.runnersConfig.authToken);
    }
    isValidAuthToken(token) {
        const tokenBuffer = Buffer.from(token);
        if (tokenBuffer.length !== this.authToken.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(tokenBuffer, this.authToken);
    }
    async createGrantToken(runnerId) {
        const grantToken = this.generateGrantToken();
        const key = this.cacheKeyForGrantToken(grantToken);
        await this.cacheService.set(key, runnerId ?? NO_BOUND_RUNNER, this.grantTokenTtlInMs);
        return grantToken;
    }
    async tryConsumeGrantToken(grantToken) {
        const key = this.cacheKeyForGrantToken(grantToken);
        const consumed = await this.cacheService.take(key);
        if (consumed === undefined)
            return { isValid: false, boundRunnerId: null };
        return {
            isValid: true,
            boundRunnerId: consumed === NO_BOUND_RUNNER ? null : consumed,
        };
    }
    generateGrantToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    cacheKeyForGrantToken(grantToken) {
        return `grant-token:${grantToken}`;
    }
};
exports.TaskBrokerAuthService = TaskBrokerAuthService;
exports.TaskBrokerAuthService = TaskBrokerAuthService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.TaskRunnersConfig, backend_services_1.CacheService])
], TaskBrokerAuthService);
//# sourceMappingURL=task-broker-auth.service.js.map