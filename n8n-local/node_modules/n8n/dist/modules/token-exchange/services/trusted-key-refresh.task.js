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
exports.TrustedKeyRefreshTask = void 0;
const decorators_1 = require("@n8n/decorators");
const trusted_key_service_1 = require("./trusted-key.service");
const REFRESH_POLL_INTERVAL_SECONDS = 60;
let TrustedKeyRefreshTask = class TrustedKeyRefreshTask {
    constructor(trustedKeyService) {
        this.trustedKeyService = trustedKeyService;
        this.name = 'trusted-key-refresh';
        this.schedule = (0, decorators_1.intervalFromSeconds)(REFRESH_POLL_INTERVAL_SECONDS);
        this.target = (0, decorators_1.clusterTarget)({ scheduler: { retryOnFailure: true } });
    }
    async run(signal) {
        await this.trustedKeyService.refreshDueSources(signal);
    }
};
exports.TrustedKeyRefreshTask = TrustedKeyRefreshTask;
exports.TrustedKeyRefreshTask = TrustedKeyRefreshTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [trusted_key_service_1.TrustedKeyService])
], TrustedKeyRefreshTask);
//# sourceMappingURL=trusted-key-refresh.task.js.map