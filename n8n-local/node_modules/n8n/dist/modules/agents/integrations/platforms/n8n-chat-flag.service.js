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
exports.N8nChatFlagService = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const posthog_1 = require("../../../../posthog");
let N8nChatFlagService = class N8nChatFlagService {
    constructor(postHogClient) {
        this.postHogClient = postHogClient;
    }
    async isEnabledFor(user) {
        try {
            const variant = (await this.postHogClient.getFeatureFlags(user))[api_types_1.AGENTS_N8N_CHAT_FLAG];
            return typeof variant === 'string' && variant !== 'control';
        }
        catch {
            return false;
        }
    }
};
exports.N8nChatFlagService = N8nChatFlagService;
exports.N8nChatFlagService = N8nChatFlagService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [posthog_1.PostHogClient])
], N8nChatFlagService);
//# sourceMappingURL=n8n-chat-flag.service.js.map