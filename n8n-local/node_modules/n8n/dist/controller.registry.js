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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerRegistry = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const express_1 = require("express");
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = __importDefault(require("node:assert"));
const auth_service_1 = require("./auth/auth.service");
const constants_1 = require("./constants");
const license_1 = require("./license");
const check_access_1 = require("./permissions.ee/check-access");
const response_helper_1 = require("./response-helper");
const abstract_server_1 = require("./abstract-server");
const cors_service_1 = require("./services/cors-service");
const last_active_at_service_1 = require("./services/last-active-at.service");
const rate_limit_service_1 = require("./services/rate-limit.service");
let ControllerRegistry = class ControllerRegistry {
    constructor(license, authService, globalConfig, metadata, lastActiveAtService, rateLimitService) {
        this.license = license;
        this.authService = authService;
        this.globalConfig = globalConfig;
        this.metadata = metadata;
        this.lastActiveAtService = lastActiveAtService;
        this.rateLimitService = rateLimitService;
    }
    activate(app) {
        for (const controllerClass of this.metadata.controllerClasses) {
            const metadata = this.metadata.getControllerMetadata(controllerClass);
            if (metadata.isPublicApi)
                continue;
            this.activateController(app, controllerClass);
        }
    }
    activateController(app, controllerClass) {
        const metadata = this.metadata.getControllerMetadata(controllerClass);
        const router = (0, express_1.Router)({ mergeParams: true });
        const basePath = metadata.registerOnRootPath
            ? metadata.basePath
            : `/${this.globalConfig.endpoints.rest}/${metadata.basePath}`;
        const prefix = basePath.replace(/\/+/g, '/').replace(/\/$/, '');
        app.use(prefix === '' ? '/' : prefix, router);
        const controller = di_1.Container.get(controllerClass);
        const controllerMiddlewares = metadata.middlewares.map((handlerName) => controller[handlerName].bind(controller));
        const staticRouters = controllerClass.routers;
        if (staticRouters) {
            for (const routerConfig of staticRouters) {
                if (!routerConfig.router) {
                    throw new n8n_workflow_1.UnexpectedError(`Router is undefined for path "${routerConfig.path}" in controller "${controllerClass.name}"`);
                }
                const middlewares = this.buildMiddlewares(routerConfig, controllerMiddlewares);
                router.use(routerConfig.path, ...middlewares, routerConfig.router);
            }
        }
        for (const [handlerName, route] of metadata.routes) {
            const nonJsonBodyArg = route.args.find((arg) => arg?.type === 'body' &&
                arg.media !== undefined &&
                arg.media.mediaType !== 'application/json');
            if (nonJsonBodyArg) {
                throw new n8n_workflow_1.UnexpectedError(`${controllerClass.name}.${handlerName} declares @Body({ mediaType: ` +
                    `'${nonJsonBodyArg.media?.mediaType}' }), which only @PublicApiController routes support.`);
            }
            const argTypes = Reflect.getMetadata('design:paramtypes', controller, handlerName);
            const handler = async (req, res) => {
                if (route.cors) {
                    const corsService = di_1.Container.get(cors_service_1.CorsService);
                    const corsOptions = route.cors === true ? {} : route.cors;
                    corsService.applyCorsHeaders(req, res, corsOptions);
                }
                const args = [req, res];
                for (let index = 0; index < route.args.length; index++) {
                    const arg = route.args[index];
                    if (!arg)
                        continue;
                    if (arg.type === 'param')
                        args.push(req.params[arg.key]);
                    else if (['body', 'query'].includes(arg.type)) {
                        const paramType = argTypes[index];
                        if (paramType && 'safeParse' in paramType) {
                            const output = paramType.safeParse(req[arg.type]);
                            if (output.success)
                                args.push(output.data);
                            else {
                                return res.status(400).json(output.error.errors[0]);
                            }
                        }
                    }
                    else
                        throw new n8n_workflow_1.UnexpectedError('Unknown arg type: ' + arg.type);
                }
                return await controller[handlerName](...args);
            };
            const bodyArgIdx = route.args.findIndex((arg) => arg?.type === 'body');
            const bodyArgType = bodyArgIdx !== -1 ? argTypes[bodyArgIdx] : undefined;
            const middlewares = this.buildMiddlewares(route, controllerMiddlewares, bodyArgType);
            const finalHandler = route.usesTemplates
                ? async (req, res) => {
                    try {
                        await handler(req, res);
                    }
                    catch (e) {
                        const error = (0, ensure_error_1.ensureError)(e);
                        (0, response_helper_1.reportError)(error, { extra: { method: req.method, path: req.path } });
                        if (res.headersSent)
                            throw error;
                        (0, response_helper_1.sendErrorResponse)(res, error);
                    }
                }
                : (0, response_helper_1.send)(handler);
            router[route.method](route.path, ...middlewares, finalHandler);
            if (route.allowBots) {
                const fullPattern = (prefix + route.path).replace(/\/+/g, '/');
                const regexStr = fullPattern.replace(/:[^/]+/g, '[^/]+');
                abstract_server_1.AbstractServer.botAllowedPaths.push(regexStr);
            }
        }
    }
    buildMiddlewares(route, controllerMiddlewares, bodyDtoClass) {
        const middlewares = [];
        if (backend_common_1.inProduction && route.ipRateLimit) {
            middlewares.push(this.rateLimitService.createIpRateLimitMiddleware(route.ipRateLimit));
        }
        if (backend_common_1.inProduction && route.keyedRateLimit?.source === 'body') {
            (0, node_assert_1.default)(bodyDtoClass, 'Body argument type (@Body decorator) is required for body-based rate limiting');
            middlewares.push(this.rateLimitService.createBodyKeyedRateLimitMiddleware(bodyDtoClass, route.keyedRateLimit));
        }
        if (!route.skipAuth) {
            middlewares.push(this.authService.createAuthMiddleware({
                allowSkipMFA: route.allowSkipMFA ?? false,
                allowSkipPreviewAuth: route.allowSkipPreviewAuth ?? false,
                allowUnauthenticated: route.allowUnauthenticated ?? false,
            }), this.lastActiveAtService.middleware.bind(this.lastActiveAtService));
        }
        if (route.keyedRateLimit?.source === 'user') {
            (0, node_assert_1.default)(!route.skipAuth, `User-based rate limiting is only supported for authenticated endpoints. Route: ${JSON.stringify(route)}`);
            if (backend_common_1.inProduction) {
                middlewares.push(this.rateLimitService.createUserKeyedRateLimitMiddleware(route.keyedRateLimit));
            }
        }
        if (route.licenseFeature) {
            middlewares.push(this.createLicenseMiddleware(route.licenseFeature));
        }
        if (route.accessScope) {
            middlewares.push(this.createScopedMiddleware(route.accessScope));
        }
        middlewares.push(...controllerMiddlewares);
        if (route.middlewares) {
            middlewares.push(...route.middlewares);
        }
        return middlewares;
    }
    createLicenseMiddleware(feature) {
        return (_req, res, next) => {
            if (!this.license.isLicensed(feature)) {
                res.status(403).json({ status: 'error', message: 'Plan lacks license for this feature' });
                return;
            }
            next();
        };
    }
    createScopedMiddleware(accessScope) {
        return async (req, res, next) => {
            if (!(0, db_1.isAuthenticatedRequest)(req))
                throw new errors_1.UnauthenticatedError();
            if (!req.user)
                throw new errors_1.UnauthenticatedError();
            const { scope, globalOnly } = accessScope;
            try {
                if (!(await (0, check_access_1.userHasScopes)(req.user, [scope], globalOnly, req.params))) {
                    res.status(403).json({
                        status: 'error',
                        message: constants_1.RESPONSE_ERROR_MESSAGES.MISSING_SCOPE,
                    });
                    return;
                }
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundError) {
                    res.status(404).json({ status: 'error', message: error.message });
                    return;
                }
                throw error;
            }
            next();
        };
    }
};
exports.ControllerRegistry = ControllerRegistry;
exports.ControllerRegistry = ControllerRegistry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [license_1.License, auth_service_1.AuthService, config_1.GlobalConfig, decorators_1.ControllerRegistryMetadata, last_active_at_service_1.LastActiveAtService, rate_limit_service_1.RateLimitService])
], ControllerRegistry);
//# sourceMappingURL=controller.registry.js.map