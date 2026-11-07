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
exports.TokenExchangeController = void 0;
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const zod_1 = require("zod");
const errors_1 = require("@n8n/errors");
const token_exchange_service_1 = require("../services/token-exchange.service");
const token_exchange_config_1 = require("../token-exchange.config");
const token_exchange_errors_1 = require("../token-exchange.errors");
const token_exchange_schemas_1 = require("../token-exchange.schemas");
const token_exchange_types_1 = require("../token-exchange.types");
const configService = di_1.Container.get(token_exchange_config_1.TokenExchangeConfig);
let TokenExchangeController = class TokenExchangeController {
    constructor() {
        this.config = di_1.Container.get(token_exchange_config_1.TokenExchangeConfig);
        this.errorReporter = di_1.Container.get(n8n_core_1.ErrorReporter);
        this.eventService = di_1.Container.get(backend_services_1.EventService);
        this.tokenExchangeService = di_1.Container.get(token_exchange_service_1.TokenExchangeService);
    }
    async exchangeToken(req, res) {
        if (!this.config.enabled) {
            res.status(501).json({
                error: 'server_error',
                error_description: 'Token exchange is not enabled on this instance',
            });
            return;
        }
        const clientIp = req.ip ?? 'unknown';
        const { data: grantTypeData } = zod_1.z
            .object({ grant_type: zod_1.z.string().optional() })
            .safeParse(req.body);
        if (grantTypeData?.grant_type !== token_exchange_schemas_1.TOKEN_EXCHANGE_GRANT_TYPE) {
            res.status(400).json({
                error: 'unsupported_grant_type',
                error_description: `grant_type must be "${token_exchange_schemas_1.TOKEN_EXCHANGE_GRANT_TYPE}"`,
            });
            return;
        }
        const parsed = token_exchange_schemas_1.TokenExchangeRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            res.status(400).json({
                error: 'invalid_request',
                error_description: firstIssue?.message ?? 'Invalid request parameters',
            });
            return;
        }
        try {
            const result = await this.tokenExchangeService.exchange(parsed.data);
            this.eventService.emit('token-exchange-succeeded', {
                subject: result.subject,
                actor: result.actor,
                scopes: parsed.data.scope,
                resource: parsed.data.resource,
                grantType: parsed.data.grant_type,
                clientIp,
                issuer: result.issuer,
            });
            res.json({
                access_token: result.accessToken,
                token_type: 'Bearer',
                expires_in: result.expiresIn,
                issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
            });
        }
        catch (error) {
            if (error instanceof errors_1.AuthError) {
                this.eventService.emit('token-exchange-failed', {
                    subject: '',
                    failureReason: error instanceof token_exchange_errors_1.TokenExchangeAuthError
                        ? error.reason
                        : token_exchange_types_1.TokenExchangeFailureReason.Other,
                    grantType: parsed.data.grant_type,
                    clientIp,
                });
                res.status(400).json({
                    error: 'invalid_grant',
                    error_description: 'Token exchange failed',
                });
                return;
            }
            if (error instanceof errors_1.BadRequestError) {
                this.eventService.emit('token-exchange-failed', {
                    subject: '',
                    failureReason: error instanceof token_exchange_errors_1.TokenExchangeRequestError
                        ? error.reason
                        : token_exchange_types_1.TokenExchangeFailureReason.InvalidFormat,
                    grantType: parsed.data.grant_type,
                    clientIp,
                });
                res.status(400).json({
                    error: 'invalid_request',
                    error_description: error.message,
                });
                return;
            }
            if (error instanceof zod_1.ZodError) {
                this.eventService.emit('token-exchange-failed', {
                    subject: '',
                    failureReason: token_exchange_types_1.TokenExchangeFailureReason.InvalidClaims,
                    grantType: parsed.data.grant_type,
                    clientIp,
                });
                res.status(400).json({
                    error: 'invalid_request',
                    error_description: 'Token claims validation failed',
                });
                return;
            }
            this.errorReporter.error(error instanceof Error ? error : new Error(String(error)));
            this.eventService.emit('token-exchange-failed', {
                subject: '',
                failureReason: token_exchange_types_1.TokenExchangeFailureReason.InternalError,
                grantType: parsed.data.grant_type,
                clientIp,
            });
            res.status(500).json({
                error: 'server_error',
                error_description: 'An unexpected error occurred during token exchange',
            });
        }
    }
};
exports.TokenExchangeController = TokenExchangeController;
__decorate([
    (0, decorators_1.Post)('/token', {
        skipAuth: true,
        ipRateLimit: {
            limit: configService.rateLimitTokenExchange,
            windowMs: 1 * constants_1.Time.minutes.toMilliseconds,
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TokenExchangeController.prototype, "exchangeToken", null);
exports.TokenExchangeController = TokenExchangeController = __decorate([
    (0, decorators_1.RestController)('/auth/oauth')
], TokenExchangeController);
//# sourceMappingURL=token-exchange.controller.js.map