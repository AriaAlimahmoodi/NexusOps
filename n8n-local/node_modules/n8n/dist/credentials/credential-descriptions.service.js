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
exports.CredentialDescriptionsService = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const posthog_1 = require("../posthog");
let CredentialDescriptionsService = class CredentialDescriptionsService {
    constructor(postHogClient) {
        this.postHogClient = postHogClient;
    }
    async isEnabled() {
        return ((await this.postHogClient.getFeatureFlagForInstance(api_types_1.CREDENTIAL_DESCRIPTIONS_FLAG)) === true);
    }
    async stripIfDisabled(credentials) {
        if (await this.isEnabled())
            return;
        for (const credential of Array.isArray(credentials) ? credentials : [credentials])
            delete credential.description;
    }
};
exports.CredentialDescriptionsService = CredentialDescriptionsService;
exports.CredentialDescriptionsService = CredentialDescriptionsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [posthog_1.PostHogClient])
], CredentialDescriptionsService);
//# sourceMappingURL=credential-descriptions.service.js.map