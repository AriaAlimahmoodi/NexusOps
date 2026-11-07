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
exports.DynamicCredentialCorsService = void 0;
const di_1 = require("@n8n/di");
const cors_service_1 = require("../../../services/cors-service");
const dynamic_credentials_config_1 = require("../dynamic-credentials.config");
let DynamicCredentialCorsService = class DynamicCredentialCorsService {
    constructor(corsService, dynamicCredentialConfig) {
        this.corsService = corsService;
        this.dynamicCredentialConfig = dynamicCredentialConfig;
        if (this.dynamicCredentialConfig.corsOrigin === null) {
            this.defaultOptions = null;
            return;
        }
        const corsOriginConfig = this.dynamicCredentialConfig.corsOrigin?.trim();
        if (!corsOriginConfig) {
            this.defaultOptions = null;
            return;
        }
        const allowedOrigins = corsOriginConfig
            .split(',')
            .map((origin) => origin.trim())
            .filter((origin) => origin.length > 0);
        if (allowedOrigins.length === 0) {
            this.defaultOptions = null;
            return;
        }
        if (this.dynamicCredentialConfig.corsAllowCredentials && allowedOrigins.includes('*')) {
            throw new Error('N8N_DYNAMIC_CREDENTIALS_CORS_ORIGIN cannot use wildcard (*) when ' +
                'N8N_DYNAMIC_CREDENTIALS_CORS_ALLOW_CREDENTIALS is true. Specify explicit origins instead.');
        }
        this.defaultOptions = {
            allowedOrigins,
            allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'X-Authorization'],
            allowCredentials: this.dynamicCredentialConfig.corsAllowCredentials,
        };
    }
    preflightHandler(req, res, allowedMethods) {
        if (this.applyCorsHeadersIfEnabled(req, res, allowedMethods)) {
            res.status(204).end();
            return;
        }
        res.status(404).end();
    }
    applyCorsHeadersIfEnabled(req, res, allowedMethods) {
        if (this.defaultOptions !== null) {
            return this.corsService.applyCorsHeaders(req, res, {
                ...this.defaultOptions,
                allowedMethods,
            });
        }
        return false;
    }
};
exports.DynamicCredentialCorsService = DynamicCredentialCorsService;
exports.DynamicCredentialCorsService = DynamicCredentialCorsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [cors_service_1.CorsService, dynamic_credentials_config_1.DynamicCredentialsConfig])
], DynamicCredentialCorsService);
//# sourceMappingURL=dynamic-credential-cors.service.js.map