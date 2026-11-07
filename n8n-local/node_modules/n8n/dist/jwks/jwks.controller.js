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
exports.JwksController = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const jwks_config_1 = require("./jwks.config");
const auth_1 = require("@n8n/backend-services/auth");
const api_types_1 = require("@n8n/api-types");
const jwksConfig = di_1.Container.get(jwks_config_1.JwksConfig);
let JwksController = class JwksController {
    constructor(jwksRegistry, logger) {
        this.jwksRegistry = jwksRegistry;
        this.logger = logger;
    }
    async getKeys(_req, res) {
        const jwks = await this.jwksRegistry.getPublicJwks();
        const keys = jwks
            .map((key) => api_types_1.PublicJwkSchema.safeParse(key))
            .filter((result) => {
            if (!result.success) {
                this.logger.warn('Failed to parse public JWK', { error: result.error });
            }
            return result.success;
        })
            .map((result) => result.data);
        const response = { keys };
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
        res.json(response);
    }
};
exports.JwksController = JwksController;
__decorate([
    (0, decorators_1.Get)('/jwks.json', {
        skipAuth: true,
        ipRateLimit: {
            limit: jwksConfig.rateLimitJwksPerMinute,
            windowMs: 1 * constants_1.Time.minutes.toMilliseconds,
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], JwksController.prototype, "getKeys", null);
exports.JwksController = JwksController = __decorate([
    (0, decorators_1.RestController)('/.well-known'),
    __metadata("design:paramtypes", [auth_1.JwksRegistry, backend_common_1.Logger])
], JwksController);
//# sourceMappingURL=jwks.controller.js.map