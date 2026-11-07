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
exports.McpServerMiddlewareService = void 0;
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const telemetry_1 = require("../../telemetry");
const mcp_api_key_service_1 = require("./mcp-api-key.service");
const mcp_protected_resource_1 = require("./mcp-protected-resource");
const mcp_constants_1 = require("./mcp.constants");
const mcp_utils_1 = require("./mcp.utils");
let McpServerMiddlewareService = class McpServerMiddlewareService {
    constructor(mcpServerApiKeyService, oauthTokenVerifier, mcpProtectedResource, jwtService, telemetry) {
        this.mcpServerApiKeyService = mcpServerApiKeyService;
        this.oauthTokenVerifier = oauthTokenVerifier;
        this.mcpProtectedResource = mcpProtectedResource;
        this.jwtService = jwtService;
        this.telemetry = telemetry;
    }
    async getUserForToken(token) {
        let decoded;
        try {
            decoded = this.jwtService.decodeUnverified(token);
        }
        catch (error) {
            return {
                user: null,
                context: {
                    reason: 'jwt_decode_failed',
                    auth_type: 'unknown',
                    error_details: (0, ensure_error_1.ensureError)(error).message,
                },
            };
        }
        if (decoded?.meta?.isOAuth === true) {
            const expectedAudience = this.mcpProtectedResource.getResourceUrl();
            return await this.oauthTokenVerifier.verifyOAuthAccessToken(token, expectedAudience);
        }
        return await this.mcpServerApiKeyService.verifyApiKey(token);
    }
    getEnabledMiddleware() {
        return async (req, res, next) => {
            if (await this.mcpProtectedResource.isAvailable()) {
                next();
                return;
            }
            if ((0, mcp_utils_1.isConnectionHandshake)(req.body)) {
                this.trackFailedConnection(req, mcp_constants_1.MCP_ACCESS_DISABLED_ERROR_MESSAGE, 404);
            }
            res.status(404).json({ message: mcp_constants_1.MCP_ACCESS_DISABLED_ERROR_MESSAGE });
        };
    }
    getAuthMiddleware() {
        return async (req, res, next) => {
            const authorizationHeader = req.header('authorization');
            if (!authorizationHeader) {
                this.responseWithUnauthorized(res, req, {
                    reason: 'missing_authorization_header',
                    auth_type: 'unknown',
                    error_details: 'Authorization header not sent',
                });
                return;
            }
            let token;
            try {
                token = this.extractBearerToken(authorizationHeader);
            }
            catch (er) {
                const error = (0, ensure_error_1.ensureError)(er);
                this.responseWithUnauthorized(res, req, {
                    reason: 'invalid_bearer_format',
                    auth_type: 'unknown',
                    error_details: error.message,
                });
                return;
            }
            const result = await this.getUserForToken(token);
            const user = result.user;
            if (!user) {
                this.responseWithUnauthorized(res, req, result.context);
                return;
            }
            req.user = user;
            const mcpReq = req;
            mcpReq.mcpCaller = result.caller;
            mcpReq.mcpScopes = result.scopes;
            next();
        };
    }
    extractBearerToken(headerValue) {
        if (!headerValue.startsWith('Bearer')) {
            throw new errors_1.AuthError('Invalid authorization header format - Missing Bearer prefix');
        }
        const tokenMatch = headerValue.match(/^Bearer\s+(.+)$/i);
        if (tokenMatch) {
            return tokenMatch[1];
        }
        throw new errors_1.AuthError('Invalid authorization header format - Malformed Bearer token');
    }
    responseWithUnauthorized(res, req, context) {
        this.trackFailedConnection(req, mcp_constants_1.UNAUTHORIZED_ERROR_MESSAGE, 401, context);
        const prmUrl = this.mcpProtectedResource.getProtectedResourceMetadataUrl();
        res.header('WWW-Authenticate', `Bearer realm="n8n MCP Server", resource_metadata="${prmUrl}"`);
        res.status(401).send({
            message: `${mcp_constants_1.UNAUTHORIZED_ERROR_MESSAGE}${context?.error_details ? ': ' + context.error_details : ''}`,
        });
    }
    trackFailedConnection(req, error, httpStatus, context) {
        const clientInfo = (0, mcp_utils_1.getClientInfo)(req);
        const payload = {
            mcp_connection_status: 'error',
            error,
            http_status: httpStatus,
            client_name: clientInfo?.name,
            client_version: clientInfo?.version,
            protocol_version: (0, mcp_utils_1.getProtocolVersion)(req),
            ...context,
        };
        this.telemetry.track(mcp_constants_1.USER_CONNECTED_TO_MCP_EVENT, payload);
    }
};
exports.McpServerMiddlewareService = McpServerMiddlewareService;
exports.McpServerMiddlewareService = McpServerMiddlewareService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [mcp_api_key_service_1.McpServerApiKeyService, auth_1.OAuthTokenVerifierProxy, mcp_protected_resource_1.McpProtectedResource, backend_services_1.JwtService, telemetry_1.Telemetry])
], McpServerMiddlewareService);
//# sourceMappingURL=mcp-server-middleware.service.js.map