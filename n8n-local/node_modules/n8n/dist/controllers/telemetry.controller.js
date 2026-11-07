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
exports.TelemetryController = void 0;
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const http_proxy_middleware_1 = require("http-proxy-middleware");
let TelemetryController = class TelemetryController {
    constructor(globalConfig, outboundHttp) {
        this.globalConfig = globalConfig;
        this.outboundHttp = outboundHttp;
        this.proxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
            target: this.globalConfig.diagnostics.frontendConfig.split(';')[1],
            changeOrigin: true,
            pathRewrite: {
                '^/proxy/': '/',
            },
            on: {
                proxyReq: (proxyReq, req) => {
                    proxyReq.removeHeader('cookie');
                    (0, http_proxy_middleware_1.fixRequestBody)(proxyReq, req);
                    return;
                },
                proxyRes: (proxyRes) => {
                    for (const header of [
                        'access-control-allow-origin',
                        'access-control-allow-credentials',
                        'access-control-allow-methods',
                        'access-control-allow-headers',
                        'access-control-expose-headers',
                    ]) {
                        delete proxyRes.headers[header];
                    }
                    proxyRes.headers['access-control-allow-origin'] = '*';
                },
                error: (_error, _req, res) => {
                    if ('writeHead' in res && !res.headersSent) {
                        res.writeHead(502, { 'Access-Control-Allow-Origin': '*' });
                        res.end('Bad Gateway');
                    }
                },
            },
        });
    }
    applyCors(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        const requestedHeaders = req.headers['access-control-request-headers'];
        res.setHeader('Access-Control-Allow-Headers', typeof requestedHeaders === 'string' && requestedHeaders.length > 0
            ? requestedHeaders
            : 'Content-Type, Authorization, anonymousId');
        res.setHeader('Access-Control-Max-Age', '600');
        res.removeHeader('Access-Control-Allow-Credentials');
    }
    proxyPreflight(req, res) {
        this.applyCors(req, res);
        res.status(204).end();
    }
    async track(req, res, next) {
        this.applyCors(req, res);
        await this.proxy(req, res, next);
    }
    async identify(req, res, next) {
        this.applyCors(req, res);
        await this.proxy(req, res, next);
    }
    async page(req, res, next) {
        this.applyCors(req, res);
        await this.proxy(req, res, next);
    }
    sourceConfigPreflight(req, res) {
        this.applyCors(req, res);
        res.status(204).end();
    }
    async sourceConfig(req, res) {
        this.applyCors(req, res);
        const response = await this.outboundHttp
            .requests({
            useDefaultSsrfPolicy: 'unsafe',
        })
            .request({
            method: 'GET',
            url: 'https://api-rs.n8n.io/sourceConfig',
            headers: {
                authorization: 'Basic ' + btoa(`${this.globalConfig.diagnostics.frontendConfig.split(';')[0]}:`),
            },
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
        });
        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(`Failed to fetch source config: ${response.statusMessage}`);
        }
        res.json(response.body);
    }
};
exports.TelemetryController = TelemetryController;
__decorate([
    (0, decorators_1.Options)('/proxy/:version/:action', {
        skipAuth: true,
        ipRateLimit: { limit: 100, windowMs: 60_000 },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TelemetryController.prototype, "proxyPreflight", null);
__decorate([
    (0, decorators_1.Post)('/proxy/:version/track', { skipAuth: true, ipRateLimit: { limit: 100, windowMs: 60_000 } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", Promise)
], TelemetryController.prototype, "track", null);
__decorate([
    (0, decorators_1.Post)('/proxy/:version/identify', {
        skipAuth: true,
        ipRateLimit: { limit: 100, windowMs: 60_000 },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", Promise)
], TelemetryController.prototype, "identify", null);
__decorate([
    (0, decorators_1.Post)('/proxy/:version/page', { skipAuth: true, ipRateLimit: { limit: 50, windowMs: 60_000 } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", Promise)
], TelemetryController.prototype, "page", null);
__decorate([
    (0, decorators_1.Options)('/rudderstack/sourceConfig', {
        skipAuth: true,
        ipRateLimit: { limit: 50, windowMs: 60_000 },
        usesTemplates: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TelemetryController.prototype, "sourceConfigPreflight", null);
__decorate([
    (0, decorators_1.Get)('/rudderstack/sourceConfig', {
        skipAuth: true,
        ipRateLimit: { limit: 50, windowMs: 60_000 },
        usesTemplates: true,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TelemetryController.prototype, "sourceConfig", null);
exports.TelemetryController = TelemetryController = __decorate([
    (0, decorators_1.RestController)('/telemetry'),
    __metadata("design:paramtypes", [config_1.GlobalConfig, backend_network_1.OutboundHttp])
], TelemetryController);
//# sourceMappingURL=telemetry.controller.js.map