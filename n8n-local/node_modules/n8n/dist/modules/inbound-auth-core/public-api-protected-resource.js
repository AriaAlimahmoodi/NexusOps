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
exports.PublicApiProtectedResource = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
let PublicApiProtectedResource = class PublicApiProtectedResource {
    constructor(urlService, globalConfig, licenseState) {
        this.urlService = urlService;
        this.globalConfig = globalConfig;
        this.licenseState = licenseState;
        this.id = 'public-api';
        this.surface = 'public-api';
        this.displayName = 'n8n public API';
        this.uiHints = { icon: 'key-round', consentType: 'api' };
        this.scopes = [...permissions_1.ALL_API_KEY_SCOPES];
    }
    getResourceUrl() {
        const baseUrl = this.urlService.getInstanceBaseUrl().replace(/\/$/, '');
        return `${baseUrl}/${this.globalConfig.publicApi.path}/v1`;
    }
    getAudiences() {
        return [this.getResourceUrl()];
    }
    async isAvailable() {
        return !this.globalConfig.publicApi.disabled && !this.licenseState.isAPIDisabled();
    }
    async authorize() {
        return await this.isAvailable();
    }
    async getGrantableScopes(user) {
        return (0, permissions_1.getApiKeyScopesForRole)(user);
    }
};
exports.PublicApiProtectedResource = PublicApiProtectedResource;
exports.PublicApiProtectedResource = PublicApiProtectedResource = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.UrlService, config_1.GlobalConfig, backend_common_1.LicenseState])
], PublicApiProtectedResource);
//# sourceMappingURL=public-api-protected-resource.js.map