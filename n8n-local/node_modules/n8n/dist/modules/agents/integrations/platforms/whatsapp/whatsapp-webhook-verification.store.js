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
exports.WhatsAppWebhookVerificationStore = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const VERIFIED_TTL_MS = 7 * constants_1.Time.days.toMilliseconds;
const cacheKey = (agentId) => `agents:whatsapp:webhook-verified:${agentId}`;
let WhatsAppWebhookVerificationStore = class WhatsAppWebhookVerificationStore {
    constructor(cacheService, logger) {
        this.cacheService = cacheService;
        this.logger = logger;
    }
    async markVerified(agentId) {
        try {
            await this.cacheService.set(cacheKey(agentId), true, VERIFIED_TTL_MS);
        }
        catch (error) {
            this.logger.warn('[WhatsAppIntegration] Failed to record the webhook handshake', {
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async clear(agentId) {
        try {
            await this.reset(agentId);
        }
        catch (error) {
            this.logger.warn('[WhatsAppIntegration] Failed to clear the webhook handshake', {
                agentId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async reset(agentId) {
        await this.cacheService.delete(cacheKey(agentId));
    }
    async isVerified(agentId) {
        return (await this.cacheService.get(cacheKey(agentId))) === true;
    }
};
exports.WhatsAppWebhookVerificationStore = WhatsAppWebhookVerificationStore;
exports.WhatsAppWebhookVerificationStore = WhatsAppWebhookVerificationStore = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.CacheService, backend_common_1.Logger])
], WhatsAppWebhookVerificationStore);
//# sourceMappingURL=whatsapp-webhook-verification.store.js.map