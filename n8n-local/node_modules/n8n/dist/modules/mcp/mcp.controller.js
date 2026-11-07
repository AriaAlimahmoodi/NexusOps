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
exports.McpController = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const lazy_import_1 = require("@n8n/utils/lazy-import");
const n8n_core_1 = require("n8n-core");
const telemetry_1 = require("../../telemetry");
const mcp_protected_resource_1 = require("./mcp-protected-resource");
const mcp_server_middleware_service_1 = require("./mcp-server-middleware.service");
const mcp_config_1 = require("./mcp.config");
const mcp_constants_1 = require("./mcp.constants");
const mcp_service_1 = require("./mcp.service");
const mcp_typeguards_1 = require("./mcp.typeguards");
const mcp_utils_1 = require("./mcp.utils");
const getAuthMiddleware = () => di_1.Container.get(mcp_server_middleware_service_1.McpServerMiddlewareService).getAuthMiddleware();
const getEnabledMiddleware = () => di_1.Container.get(mcp_server_middleware_service_1.McpServerMiddlewareService).getEnabledMiddleware();
const mcpConfig = di_1.Container.get(mcp_config_1.McpConfig);
let McpController = class McpController {
    constructor(errorReporter, mcpService, telemetry, logger, mcpProtectedResource) {
        this.errorReporter = errorReporter;
        this.mcpService = mcpService;
        this.telemetry = telemetry;
        this.logger = logger;
        this.mcpProtectedResource = mcpProtectedResource;
    }
    setCorsHeaders(res) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, MCP-Protocol-Version, Mcp-Method, Mcp-Name');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
    }
    async discoverAuthSchemeHead(_req, res) {
        this.setCorsHeaders(res);
        const prmUrl = this.mcpProtectedResource.getProtectedResourceMetadataUrl();
        res.header('WWW-Authenticate', `Bearer realm="n8n MCP Server", resource_metadata="${prmUrl}"`);
        res.status(401).end();
    }
    async handleGet(_req, res) {
        this.setCorsHeaders(res);
        res.header('Allow', 'POST');
        res.status(405).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.',
            },
            id: null,
        });
    }
    async build(req, res) {
        this.setCorsHeaders(res);
        const body = req.body;
        this.logger.debug('MCP Request', { body });
        const isDiscoverHandshake = (0, mcp_typeguards_1.isJSONRPCRequest)(body) && body.method === mcp_constants_1.MCP_DISCOVER_METHOD;
        const isHandshake = (0, mcp_utils_1.isConnectionHandshake)(body);
        const isToolCallRequest = (0, mcp_typeguards_1.isJSONRPCRequest)(body) ? body.method === 'tools/call' : false;
        const clientInfo = (0, mcp_utils_1.getClientInfo)(req);
        const featureFlags = await this.mcpService.resolveFeatureFlags(req.user);
        const telemetryPayload = {
            user_id: req.user.id,
            client_name: clientInfo?.name,
            client_version: clientInfo?.version,
            protocol_version: (0, mcp_utils_1.getProtocolVersion)(req),
            auth_type: req.mcpCaller?.authType,
            mcp_apps_enabled: featureFlags.mcpApps.enabled,
            mcp_apps_variant: featureFlags.mcpApps.variant,
        };
        try {
            const transportError = await this.handleTransportRequest(req, res, featureFlags, req.body);
            if (isHandshake) {
                const unservableDiscover = isDiscoverHandshake && !telemetryPayload.protocol_version;
                const failed = res.statusCode >= 400 || unservableDiscover;
                if (!failed && !transportError)
                    this.mcpService.recordDiscoveryConnection(req.user.id, clientInfo?.name, req.mcpCaller);
                this.trackConnectionEvent({
                    ...telemetryPayload,
                    mcp_connection_status: failed ? 'error' : 'success',
                    ...(failed && {
                        error: unservableDiscover
                            ? mcp_constants_1.MISSING_PROTOCOL_VERSION_ERROR_MESSAGE
                            : (transportError ?? mcp_constants_1.HANDSHAKE_FAILED_ERROR_MESSAGE),
                        http_status: res.statusCode,
                    }),
                });
            }
            else if (isToolCallRequest) {
                this.logger.debug('MCP Tool Call request', body);
            }
        }
        catch (error) {
            this.errorReporter.error(error);
            if (isHandshake) {
                this.trackConnectionEvent({
                    ...telemetryPayload,
                    mcp_connection_status: 'error',
                    error: error instanceof Error ? error.message : String(error),
                    http_status: res.headersSent ? res.statusCode : 500,
                });
            }
            if (!res.headersSent) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: mcp_constants_1.INTERNAL_SERVER_ERROR_MESSAGE,
                    },
                    id: null,
                });
            }
        }
    }
    async handleTransportRequest(req, res, featureFlags, body) {
        const { createMcpHandler } = await (0, lazy_import_1.lazyImport)(async () => await import('@modelcontextprotocol/server'));
        const { toNodeHandler } = await (0, lazy_import_1.lazyImport)(async () => await import('@modelcontextprotocol/node'));
        const mcpReq = req;
        const auth = {
            caller: mcpReq.mcpCaller,
            grantedScopes: mcpReq.mcpScopes,
        };
        let reportedError;
        const handler = createMcpHandler(async () => await this.mcpService.getServer(req.user, featureFlags, (0, mcp_utils_1.getClientInfo)(req), auth), {
            legacy: 'stateless',
            onerror: (error) => {
                reportedError ??= error.message;
                this.errorReporter.error(error);
            },
        });
        await toNodeHandler(handler)(req, res, body);
        return reportedError;
    }
    trackConnectionEvent(payload) {
        this.telemetry.track(mcp_constants_1.USER_CONNECTED_TO_MCP_EVENT, payload);
    }
};
exports.McpController = McpController;
__decorate([
    (0, decorators_1.Head)('/http', {
        middlewares: [getEnabledMiddleware()],
        skipAuth: true,
        usesTemplates: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpController.prototype, "discoverAuthSchemeHead", null);
__decorate([
    (0, decorators_1.Get)('/http', {
        ipRateLimit: (0, decorators_1.createIpRateLimit)(mcpConfig.rateLimitServer),
        middlewares: [getEnabledMiddleware(), getAuthMiddleware()],
        skipAuth: true,
        usesTemplates: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpController.prototype, "handleGet", null);
__decorate([
    (0, decorators_1.Post)('/http', {
        ipRateLimit: (0, decorators_1.createIpRateLimit)(mcpConfig.rateLimitServer),
        middlewares: [getEnabledMiddleware(), getAuthMiddleware()],
        skipAuth: true,
        usesTemplates: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpController.prototype, "build", null);
exports.McpController = McpController = __decorate([
    (0, decorators_1.RootLevelController)('/mcp-server'),
    __metadata("design:paramtypes", [n8n_core_1.ErrorReporter, mcp_service_1.McpService, telemetry_1.Telemetry, backend_common_1.Logger, mcp_protected_resource_1.McpProtectedResource])
], McpController);
//# sourceMappingURL=mcp.controller.js.map