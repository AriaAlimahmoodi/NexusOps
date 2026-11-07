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
exports.ScimAuthMiddleware = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const scim_settings_service_1 = require("./scim-settings.service");
const scim_token_service_1 = require("./scim-token.service");
let ScimAuthMiddleware = class ScimAuthMiddleware {
    constructor(logger, scimTokenService, scimSettingsService) {
        this.logger = logger;
        this.scimTokenService = scimTokenService;
        this.scimSettingsService = scimSettingsService;
    }
    getAuthMiddleware() {
        return this.authenticate.bind(this);
    }
    async authenticate(req, res, next) {
        try {
            if (!(await this.scimSettingsService.isEnabled())) {
                return res
                    .status(403)
                    .header('Content-Type', 'application/scim+json')
                    .json({
                    schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
                    status: '403',
                    detail: 'SCIM provisioning is disabled',
                });
            }
            const bearer = /^Bearer[ \t]+(.+)$/i.exec(req.headers.authorization ?? '');
            if (!bearer) {
                this.logger.warn('SCIM: Missing or invalid Authorization header');
                return this.unauthorized(res, 'Authorization header with Bearer token required');
            }
            const token = bearer[1].trim();
            const isValid = await this.scimTokenService.verifyApiKey(token);
            if (!isValid) {
                this.logger.warn('SCIM: Invalid API key provided');
                return this.unauthorized(res, 'Invalid SCIM API key');
            }
            return next();
        }
        catch (error) {
            this.logger.error('SCIM: Error during authentication', { error });
            return res
                .status(500)
                .header('Content-Type', 'application/scim+json')
                .json({
                schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
                status: '500',
                detail: 'Internal server error',
            });
        }
    }
    unauthorized(res, detail) {
        return res
            .status(401)
            .header('WWW-Authenticate', 'Bearer realm="n8n SCIM"')
            .header('Content-Type', 'application/scim+json')
            .json({
            schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
            status: '401',
            detail,
        });
    }
};
exports.ScimAuthMiddleware = ScimAuthMiddleware;
exports.ScimAuthMiddleware = ScimAuthMiddleware = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, scim_token_service_1.ScimTokenService, scim_settings_service_1.ScimSettingsService])
], ScimAuthMiddleware);
//# sourceMappingURL=scim-auth.middleware.js.map