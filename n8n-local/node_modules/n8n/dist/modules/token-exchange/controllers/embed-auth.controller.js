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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedAuthController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const auth_service_1 = require("../../../auth/auth.service");
const validate_redirect_url_1 = require("../../../utils/validate-redirect-url");
const token_exchange_service_1 = require("../services/token-exchange.service");
const token_exchange_config_1 = require("../token-exchange.config");
const token_exchange_errors_1 = require("../token-exchange.errors");
const token_exchange_types_1 = require("../token-exchange.types");
const configService = di_1.Container.get(token_exchange_config_1.TokenExchangeConfig);
let EmbedAuthController = class EmbedAuthController {
    constructor(config, tokenExchangeService, authService, urlService, eventService) {
        this.config = config;
        this.tokenExchangeService = tokenExchangeService;
        this.authService = authService;
        this.urlService = urlService;
        this.eventService = eventService;
    }
    async getLogin(req, res, query) {
        if (!this.config.embedEnabled) {
            res.status(501).json({
                error: 'server_error',
                error_description: 'Embed login is not enabled on this instance',
            });
            return;
        }
        return await this.handleLogin(query.token, req, res, query.redirectTo);
    }
    async postLogin(req, res, body) {
        if (!this.config.embedEnabled) {
            res.status(501).json({
                error: 'server_error',
                error_description: 'Embed login is not enabled on this instance',
            });
            return;
        }
        return await this.handleLogin(body.token, req, res, body.redirectTo);
    }
    async handleLogin(subjectToken, req, res, redirect) {
        try {
            const { user, subject, issuer, kid } = await this.tokenExchangeService.embedLogin(subjectToken);
            this.authService.issueCookie(res, user, true, req.browserId, true, {
                sameSite: 'none',
                secure: true,
            });
            this.eventService.emit('embed-login', {
                subject,
                issuer,
                kid,
                clientIp: req.ip ?? 'unknown',
            });
            const safePath = (0, validate_redirect_url_1.validateRedirectUrl)(redirect ?? '');
            res.redirect(this.urlService.getInstanceBaseUrl() + safePath);
        }
        catch (error) {
            this.eventService.emit('embed-login-failed', {
                failureReason: error instanceof token_exchange_errors_1.TokenExchangeAuthError || error instanceof token_exchange_errors_1.TokenExchangeRequestError
                    ? error.reason
                    : token_exchange_types_1.TokenExchangeFailureReason.InternalError,
                clientIp: req.ip ?? 'unknown',
            });
            throw error;
        }
    }
};
exports.EmbedAuthController = EmbedAuthController;
__decorate([
    (0, decorators_1.Get)('/', {
        skipAuth: true,
        ipRateLimit: {
            limit: configService.rateLimitEmbedLogin,
            windowMs: 1 * constants_1.Time.minutes.toMilliseconds,
        },
    }),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.EmbedLoginQueryDto]),
    __metadata("design:returntype", Promise)
], EmbedAuthController.prototype, "getLogin", null);
__decorate([
    (0, decorators_1.Post)('/', {
        skipAuth: true,
        ipRateLimit: {
            limit: configService.rateLimitEmbedLogin,
            windowMs: 1 * constants_1.Time.minutes.toMilliseconds,
        },
    }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.EmbedLoginBodyDto]),
    __metadata("design:returntype", Promise)
], EmbedAuthController.prototype, "postLogin", null);
exports.EmbedAuthController = EmbedAuthController = __decorate([
    (0, decorators_1.RestController)('/auth/embed'),
    __metadata("design:paramtypes", [token_exchange_config_1.TokenExchangeConfig, token_exchange_service_1.TokenExchangeService, auth_service_1.AuthService, backend_services_1.UrlService, backend_services_1.EventService])
], EmbedAuthController);
//# sourceMappingURL=embed-auth.controller.js.map