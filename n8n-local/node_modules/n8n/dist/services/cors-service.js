"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorsService = void 0;
const di_1 = require("@n8n/di");
let CorsService = class CorsService {
    constructor() {
        this.defaultOptions = {
            allowedOrigins: ['*'],
            allowedMethods: ['get', 'post', 'options', 'put', 'patch', 'delete'],
            allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
            maxAge: 86400,
        };
    }
    applyCorsHeaders(req, res, options) {
        const config = { ...this.defaultOptions, ...options };
        const requestOrigin = req.headers.origin;
        if (!requestOrigin)
            return false;
        const isAllowed = this.isOriginAllowed(requestOrigin, config.allowedOrigins ?? []);
        if (!isAllowed)
            return false;
        res.header('Access-Control-Allow-Origin', requestOrigin);
        if (config.allowCredentials !== undefined) {
            res.header('Access-Control-Allow-Credentials', `${config.allowCredentials}`);
        }
        if (config.allowedMethods) {
            res.header('Access-Control-Allow-Methods', config.allowedMethods.join(', ').toUpperCase());
        }
        if (config.allowedHeaders) {
            res.header('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
        }
        if (config.maxAge) {
            res.header('Access-Control-Max-Age', config.maxAge.toString());
        }
        return true;
    }
    isOriginAllowed(origin, allowedOrigins) {
        return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
    }
};
exports.CorsService = CorsService;
exports.CorsService = CorsService = __decorate([
    (0, di_1.Service)()
], CorsService);
//# sourceMappingURL=cors-service.js.map