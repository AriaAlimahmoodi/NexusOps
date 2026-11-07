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
exports.PublicApiControllerRegistry = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const express_1 = require("express");
const zod_1 = require("zod");
const feature_not_licensed_error_1 = require("../errors/feature-not-licensed.error");
const idempotency_middleware_1 = require("../idempotency/idempotency.middleware");
const idempotency_key_service_1 = require("../public-api/idempotency-key.service");
const errors_1 = require("@n8n/errors");
const license_1 = require("../license");
const content_type_1 = require("../public-api/media-types/content-type");
const binary_response_1 = require("../public-api/media-types/binary-response");
const check_access_1 = require("../permissions.ee/check-access");
const constants_2 = require("../public-api/constants");
const public_api_route_resolver_1 = require("../public-api/public-api-route-resolver");
const public_api_validation_error_1 = require("../public-api/public-api-validation-error");
const public_api_rate_limit_service_1 = require("../public-api/public-api-rate-limit.service");
const public_api_error_response_1 = require("../public-api/v1/public-api-error-response");
const last_active_at_service_1 = require("../services/last-active-at.service");
function parsePathParam(key, schema, params) {
    const output = zod_1.z.object({ [key]: schema }).safeParse(params);
    if (!output.success) {
        throw new errors_1.BadRequestError((0, public_api_validation_error_1.formatValidationError)('params', output.error));
    }
    return output.data[key];
}
function matchesPathTemplate(template, path) {
    const templateSegments = template.split('/');
    const pathSegments = (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path).split('/');
    return (templateSegments.length === pathSegments.length &&
        templateSegments.every((segment, i) => segment.startsWith(':') || segment.toLowerCase() === pathSegments[i].toLowerCase()));
}
function routePath(prefix, req) {
    const path = (prefix === '/' ? '' : prefix) + req.path;
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}
let PublicApiControllerRegistry = class PublicApiControllerRegistry {
    constructor(metadata, authStrategyRegistry, lastActiveAtService, eventService, rateLimitService, idempotencyKeyService, logger) {
        this.metadata = metadata;
        this.authStrategyRegistry = authStrategyRegistry;
        this.lastActiveAtService = lastActiveAtService;
        this.eventService = eventService;
        this.rateLimitService = rateLimitService;
        this.idempotencyKeyService = idempotencyKeyService;
        this.logger = logger;
    }
    activate(router, apiVersion) {
        const idempotency = (0, idempotency_middleware_1.createIdempotencyMiddleware)(this.idempotencyKeyService);
        const methodsByTemplate = new Map();
        for (const route of (0, public_api_route_resolver_1.resolvePublicApiRoutes)()) {
            const methods = methodsByTemplate.get(route.path) ?? [];
            methods.push(route.method.toUpperCase());
            methodsByTemplate.set(route.path, methods);
        }
        const allowedMethodsFor = (path) => {
            const allowed = new Set();
            for (const [template, methods] of methodsByTemplate) {
                if (!matchesPathTemplate(template, path)) {
                    continue;
                }
                for (const method of methods) {
                    allowed.add(method);
                }
            }
            return [...allowed];
        };
        router.use((req, res, next) => {
            if (req.method !== 'HEAD') {
                return next();
            }
            const allowed = allowedMethodsFor(req.path);
            if (allowed.length === 0) {
                return next();
            }
            res.set('Allow', allowed.join(', '));
            res.status(405).json({ message: 'HEAD method not allowed' });
        });
        for (const controllerClass of this.metadata.controllerClasses) {
            const metadata = this.metadata.getControllerMetadata(controllerClass);
            if (!metadata.isPublicApi)
                continue;
            this.activateController(router, controllerClass, apiVersion, idempotency);
        }
        for (const path of methodsByTemplate.keys()) {
            router.all(path, (req, res) => {
                res.set('Allow', allowedMethodsFor(req.path).join(', '));
                res.status(405).json({ message: `${req.method} method not allowed` });
            });
        }
    }
    activateController(parent, controllerClass, apiVersion, idempotency) {
        const metadata = this.metadata.getControllerMetadata(controllerClass);
        const controllerRouter = (0, express_1.Router)({ mergeParams: true });
        const prefix = metadata.basePath.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
        parent.use(prefix === '' ? '/' : prefix, controllerRouter);
        const controller = di_1.Container.get(controllerClass);
        const controllerMiddlewares = metadata.middlewares.map((handlerName) => controller[handlerName].bind(controller));
        for (const [handlerName, route] of metadata.routes) {
            const resolvedArgs = (0, public_api_route_resolver_1.resolveRouteArgs)(controllerClass, handlerName, route.args);
            const successStatus = (0, public_api_route_resolver_1.resolveSuccessStatus)(controllerClass.name, handlerName, route.successStatus);
            const bodyArg = (0, public_api_route_resolver_1.findBodyArg)(resolvedArgs);
            const bodyRequired = bodyArg
                ? (bodyArg.required ?? (0, public_api_route_resolver_1.isRequestBodyRequired)(bodyArg.dto))
                : false;
            const handler = async (req, res) => {
                const args = [req, res];
                for (const arg of resolvedArgs) {
                    if (arg.type === 'param') {
                        args.push(arg.schema ? parsePathParam(arg.key, arg.schema, req.params) : req.params[arg.key]);
                        continue;
                    }
                    const isBodyArg = arg.type === 'body' && bodyArg;
                    const input = isBodyArg ? bodyArg.handler.readInput(req) : req[arg.type];
                    const output = arg.dto.safeParse(input);
                    if (output.success) {
                        args.push(output.data);
                    }
                    else {
                        const message = isBodyArg
                            ? bodyArg.handler.formatValidationError(output.error)
                            : (0, public_api_validation_error_1.formatValidationError)(arg.type, output.error);
                        throw new errors_1.BadRequestError(message);
                    }
                }
                if (route.binaryResponse) {
                    const result = await controller[handlerName](...args);
                    await (0, binary_response_1.sendBinaryResponse)(res, route.binaryResponse, successStatus, `${controllerClass.name}.${handlerName}`, result);
                    await this.releaseIdempotencyClaim(res);
                    return;
                }
                const result = await controller[handlerName](...args);
                if (res.headersSent) {
                    await this.releaseIdempotencyClaim(res);
                    return;
                }
                if (successStatus === 204 || (!route.responseDto && result === undefined)) {
                    await this.storeIdempotencyResponse(res, successStatus, null);
                    res.status(successStatus).send();
                    return;
                }
                const body = route.responseDto ? route.responseDto.parse(result) : result;
                await this.storeIdempotencyResponse(res, successStatus, body);
                res.status(successStatus).json(body);
            };
            const middlewares = [];
            if (route.deprecated) {
                middlewares.push(this.createDeprecationMiddleware(route.deprecated));
            }
            middlewares.push(this.createAuthMiddleware(apiVersion, prefix));
            middlewares.push(...this.rateLimitService.createRouteLimiters(route.method, route.rateLimitAccess));
            const paramArgs = (0, public_api_route_resolver_1.findValidatedParamArgs)(resolvedArgs);
            if (paramArgs.length) {
                middlewares.push(this.createPathParamMiddleware(paramArgs));
            }
            if (route.apiKeyScope) {
                middlewares.push(this.createApiKeyScopeMiddleware(route.apiKeyScope));
            }
            if (route.accessScope) {
                middlewares.push(this.createAccessScopeMiddleware(route.accessScope));
            }
            if (route.licenseFeature) {
                middlewares.push(this.createLicenseMiddleware(route.licenseFeature));
            }
            if (route.requiresUserQuota) {
                middlewares.push(this.createUserQuotaMiddleware());
            }
            if (bodyArg) {
                middlewares.push(this.createBodyMiddleware(bodyArg.media, bodyRequired, bodyArg.handler));
            }
            middlewares.push(...controllerMiddlewares, ...(route.middlewares ?? []), idempotency);
            const finalHandler = async (req, res, next) => {
                try {
                    await handler(req, res);
                }
                catch (error) {
                    await this.releaseIdempotencyClaim(res);
                    if (res.headersSent) {
                        next(error);
                        return;
                    }
                    (0, public_api_error_response_1.sendPublicApiErrorResponse)(res, error instanceof Error ? error : new Error(String(error)));
                }
            };
            controllerRouter[route.method](route.path, ...middlewares, finalHandler);
        }
    }
    async storeIdempotencyResponse(res, status, body) {
        const id = (0, idempotency_middleware_1.takeIdempotencyClaimId)(res);
        if (!id)
            return;
        try {
            await this.idempotencyKeyService.complete(id, status, body);
        }
        catch (error) {
            this.logger.error('Failed to store an idempotency response', { error });
            await this.releaseIdempotencyClaimById(id);
        }
    }
    async releaseIdempotencyClaim(res) {
        const id = (0, idempotency_middleware_1.takeIdempotencyClaimId)(res);
        if (!id)
            return;
        await this.releaseIdempotencyClaimById(id);
    }
    async releaseIdempotencyClaimById(id) {
        try {
            await this.idempotencyKeyService.release(id);
        }
        catch (error) {
            this.logger.error('Failed to release an idempotency key', { error });
        }
    }
    createAuthMiddleware(apiVersion, prefix) {
        return async (req, res, next) => {
            const authenticated = await this.authStrategyRegistry.authenticate(req);
            if (!authenticated) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const userId = req.user?.id;
            if (userId) {
                this.lastActiveAtService.updateLastActiveIfStale(userId).catch(() => undefined);
                this.eventService.emit('public-api-invoked', {
                    userId,
                    path: routePath(prefix, req),
                    method: req.method,
                    apiVersion,
                    userAgent: req.headers['user-agent'],
                });
            }
            next();
        };
    }
    createDeprecationMiddleware({ since }) {
        const deprecation = `@${Math.floor(since.getTime() / 1000)}`;
        return (_req, res, next) => {
            res.setHeader('Deprecation', deprecation);
            next();
        };
    }
    createApiKeyScopeMiddleware(requirement) {
        return (req, res, next) => {
            const { tokenGrant } = req;
            if (!tokenGrant || !(0, public_api_route_resolver_1.apiKeyScopesSatisfy)(tokenGrant.apiKeyScopes, requirement)) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }
            next();
        };
    }
    createLicenseMiddleware(feature) {
        return (_req, res, next) => {
            if (!di_1.Container.get(license_1.License).isLicensed(feature)) {
                res.status(403).json({ message: new feature_not_licensed_error_1.FeatureNotLicensedError(feature).message });
                return;
            }
            next();
        };
    }
    createUserQuotaMiddleware() {
        return (_req, res, next) => {
            if (di_1.Container.get(backend_common_1.LicenseState).getMaxUsers() !== constants_1.UNLIMITED_LICENSE_QUOTA) {
                res.status(403).json({ message: constants_2.USER_QUOTA_FORBIDDEN_MESSAGE });
                return;
            }
            next();
        };
    }
    createBodyMiddleware(media, bodyRequired, handler) {
        return async (req, res, next) => {
            let matched;
            try {
                matched = (0, content_type_1.assertContentType)({
                    header: req.headers['content-type'],
                    expected: media.mediaType,
                    bodyRequired,
                });
            }
            catch (error) {
                (0, public_api_error_response_1.sendPublicApiErrorResponse)(res, error instanceof errors_1.UnsupportedMediaTypeError ? error : new Error(String(error)));
                return;
            }
            if (!matched || !handler.parseBody) {
                next();
                return;
            }
            try {
                await handler.parseBody(media, req, res);
            }
            catch (error) {
                (0, public_api_error_response_1.sendPublicApiErrorResponse)(res, error instanceof Error ? error : new Error(String(error)));
                return;
            }
            next();
        };
    }
    createPathParamMiddleware(args) {
        return (req, res, next) => {
            try {
                for (const { key, schema } of args) {
                    parsePathParam(key, schema, req.params);
                }
            }
            catch (error) {
                (0, public_api_error_response_1.sendPublicApiErrorResponse)(res, error instanceof Error ? error : new Error(String(error)));
                return;
            }
            next();
        };
    }
    createAccessScopeMiddleware(accessScope) {
        return async (req, res, next) => {
            const authReq = req;
            if (!authReq.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            try {
                if (!(await (0, check_access_1.userHasScopes)(authReq.user, [accessScope.scope], accessScope.globalOnly, req.params))) {
                    res.status(403).json({ message: 'Forbidden' });
                    return;
                }
            }
            catch (error) {
                (0, public_api_error_response_1.sendPublicApiErrorResponse)(res, error instanceof Error ? error : new Error(String(error)));
                return;
            }
            next();
        };
    }
};
exports.PublicApiControllerRegistry = PublicApiControllerRegistry;
exports.PublicApiControllerRegistry = PublicApiControllerRegistry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [decorators_1.ControllerRegistryMetadata, auth_1.AuthStrategyRegistry, last_active_at_service_1.LastActiveAtService, backend_services_1.EventService, public_api_rate_limit_service_1.PublicApiRateLimitService, idempotency_key_service_1.IdempotencyKeyService, backend_common_1.Logger])
], PublicApiControllerRegistry);
//# sourceMappingURL=public-api-controller.registry.js.map