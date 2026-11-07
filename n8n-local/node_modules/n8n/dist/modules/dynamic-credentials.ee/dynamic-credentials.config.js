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
exports.DynamicCredentialsConfig = void 0;
const config_1 = require("@n8n/config");
let DynamicCredentialsConfig = class DynamicCredentialsConfig {
    constructor() {
        this.corsOrigin = '';
        this.corsAllowCredentials = false;
        this.endpointAuthToken = '';
        this.rateLimitPerMinute = 60;
        this.rateLimitAuthorizePerMinute = 60;
    }
};
exports.DynamicCredentialsConfig = DynamicCredentialsConfig;
__decorate([
    (0, config_1.Env)('N8N_DYNAMIC_CREDENTIALS_CORS_ORIGIN'),
    __metadata("design:type", String)
], DynamicCredentialsConfig.prototype, "corsOrigin", void 0);
__decorate([
    (0, config_1.Env)('N8N_DYNAMIC_CREDENTIALS_CORS_ALLOW_CREDENTIALS'),
    __metadata("design:type", Boolean)
], DynamicCredentialsConfig.prototype, "corsAllowCredentials", void 0);
__decorate([
    (0, config_1.Env)('N8N_DYNAMIC_CREDENTIALS_ENDPOINT_AUTH_TOKEN'),
    __metadata("design:type", String)
], DynamicCredentialsConfig.prototype, "endpointAuthToken", void 0);
__decorate([
    (0, config_1.Env)('N8N_DYNAMIC_CREDENTIALS_RATE_LIMIT_PER_MINUTE'),
    __metadata("design:type", Number)
], DynamicCredentialsConfig.prototype, "rateLimitPerMinute", void 0);
__decorate([
    (0, config_1.Env)('N8N_DYNAMIC_CREDENTIALS_AUTHORIZE_RATE_LIMIT_PER_MINUTE'),
    __metadata("design:type", Number)
], DynamicCredentialsConfig.prototype, "rateLimitAuthorizePerMinute", void 0);
exports.DynamicCredentialsConfig = DynamicCredentialsConfig = __decorate([
    config_1.Config
], DynamicCredentialsConfig);
//# sourceMappingURL=dynamic-credentials.config.js.map