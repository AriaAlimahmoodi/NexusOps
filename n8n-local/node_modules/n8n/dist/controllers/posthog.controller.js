"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostHogController = void 0;
exports.maskIp = maskIp;
exports.setPostHogProxyHeaders = setPostHogProxyHeaders;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const express_1 = require("express");
const http_proxy_middleware_1 = require("http-proxy-middleware");
function expandIpv6Groups(ip) {
    const [head, tail] = ip.split('%')[0].split('::');
    const headGroups = head ? head.split(':') : [];
    if (tail === undefined) {
        return headGroups;
    }
    const tailGroups = tail ? tail.split(':') : [];
    const fillCount = Math.max(0, 8 - headGroups.length - tailGroups.length);
    const fill = Array.from({ length: fillCount }, () => '0');
    return [...headGroups, ...fill, ...tailGroups];
}
function maskIp(ip) {
    const v4Mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
    const ipv4 = v4Mapped ? v4Mapped[1] : ip;
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ipv4)) {
        return ipv4.replace(/\.\d{1,3}$/, '.0');
    }
    if (ip.includes(':')) {
        const groups = expandIpv6Groups(ip);
        return `${groups[0] ?? '0'}:${groups[1] ?? '0'}:${groups[2] ?? '0'}::`;
    }
    return ip;
}
function setPostHogProxyHeaders(proxyReq, req) {
    proxyReq.removeHeader('cookie');
    if (req.ip) {
        proxyReq.setHeader('X-PH-Client-IP', maskIp(req.ip));
    }
    if (req.method === 'POST' && req.rawBody) {
        proxyReq.setHeader('Content-Length', req.rawBody.length.toString());
        proxyReq.write(req.rawBody);
    }
}
let PostHogController = class PostHogController {
};
exports.PostHogController = PostHogController;
PostHogController.routers = [
    {
        path: '/',
        router: (() => {
            const router = (0, express_1.Router)();
            const globalConfig = di_1.Container.get(config_1.GlobalConfig);
            const targetUrl = globalConfig.diagnostics.posthogConfig.apiHost;
            const proxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
                target: targetUrl,
                changeOrigin: true,
                on: {
                    proxyReq: (proxyReq, req) => setPostHogProxyHeaders(proxyReq, req),
                },
            });
            router.use(proxy);
            return router;
        })(),
        skipAuth: true,
    },
];
exports.PostHogController = PostHogController = __decorate([
    (0, decorators_1.RestController)('/ph')
], PostHogController);
//# sourceMappingURL=posthog.controller.js.map