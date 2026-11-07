"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBodyArg = findBodyArg;
exports.findValidatedParamArgs = findValidatedParamArgs;
exports.resolveRouteArgs = resolveRouteArgs;
exports.isRequestBodyRequired = isRequestBodyRequired;
exports.resolveSuccessStatus = resolveSuccessStatus;
exports.apiKeyScopesSatisfy = apiKeyScopesSatisfy;
exports.scopesInRequirement = scopesInRequirement;
exports.scopeRequirementToString = scopeRequirementToString;
exports.toOpenApiPathTemplate = toOpenApiPathTemplate;
exports.resolvePublicApiRoutes = resolvePublicApiRoutes;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const request_body_1 = require("../public-api/media-types/request-body");
function findBodyArg(args) {
    return args.find((arg) => arg.type === 'body');
}
function findQueryArg(args) {
    return args.find((arg) => arg.type === 'query');
}
function findValidatedParamArgs(args) {
    return args.filter((arg) => arg.type === 'param' && arg.schema !== undefined);
}
function resolveRouteArgs(controllerClass, handlerName, args) {
    const argTypes = Reflect.getMetadata('design:paramtypes', controllerClass.prototype, handlerName);
    const resolved = [];
    let sawDecoratedArg = false;
    const paramCount = Math.max(args.length, argTypes?.length ?? 0);
    for (let index = 0; index < paramCount; index++) {
        const arg = args[index];
        if (!arg) {
            if (sawDecoratedArg) {
                throw new n8n_workflow_1.UnexpectedError(`Public API route ${controllerClass.name}.${handlerName} has an undecorated parameter ` +
                    `at index ${index}, after an already-decorated one. Every parameter after the first ` +
                    '@Param/@Body/@Query must also be decorated, or a later argument would silently bind ' +
                    'to the wrong parameter.');
            }
            continue;
        }
        sawDecoratedArg = true;
        if (arg.type === 'param') {
            resolved.push(arg);
            continue;
        }
        const paramType = argTypes?.[index];
        if (!paramType || !('safeParse' in paramType)) {
            throw new n8n_workflow_1.UnexpectedError(`Public API route ${controllerClass.name}.${handlerName} is missing a Zod DTO for @${arg.type}`);
        }
        if (arg.type === 'body') {
            const media = arg.media ?? request_body_1.JSON_REQUEST_BODY_MEDIA;
            resolved.push({
                type: 'body',
                dto: paramType,
                ...(arg.required !== undefined && { required: arg.required }),
                media,
                handler: request_body_1.REQUEST_BODY_HANDLERS[media.mediaType],
            });
            continue;
        }
        resolved.push({ type: 'query', dto: paramType });
    }
    return resolved;
}
function isRequestBodyRequired(dto) {
    return !dto.safeParse({}).success;
}
function resolveSuccessStatus(controllerName, handlerName, successStatus) {
    if (successStatus === undefined) {
        throw new n8n_workflow_1.UnexpectedError(`Public API route ${controllerName}.${handlerName} does not declare a success status. Add ` +
            '`@ApiResponse(200, SomeDto)` if it returns a body, or `@ApiResponse(204)` if it does not.');
    }
    return successStatus;
}
function apiKeyScopesSatisfy(granted, requirement) {
    if (!granted)
        return false;
    if (typeof requirement === 'string') {
        return granted.includes(requirement);
    }
    if ('anyOf' in requirement) {
        return requirement.anyOf.some((scope) => granted.includes(scope));
    }
    return requirement.allOf.every((scope) => granted.includes(scope));
}
function scopesInRequirement(requirement) {
    if (typeof requirement === 'string')
        return [requirement];
    return 'anyOf' in requirement ? requirement.anyOf : requirement.allOf;
}
function scopeRequirementToString(requirement) {
    if (typeof requirement === 'string') {
        return requirement;
    }
    if ('anyOf' in requirement) {
        return requirement.anyOf.join(',');
    }
    return requirement.allOf.join(',');
}
function toOpenApiPathTemplate(path) {
    return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}
function resolvePublicApiRoutes() {
    const metadata = di_1.Container.get(decorators_1.ControllerRegistryMetadata);
    const resolved = [];
    for (const controllerClass of metadata.controllerClasses) {
        const controllerMetadata = metadata.getControllerMetadata(controllerClass);
        if (!controllerMetadata.isPublicApi) {
            continue;
        }
        const prefix = controllerMetadata.basePath.replace(/\/+/g, '/').replace(/\/$/, '');
        for (const [handlerName, route] of controllerMetadata.routes) {
            const args = resolveRouteArgs(controllerClass, handlerName, route.args);
            const requestBodyArg = findBodyArg(args);
            const requestBodyDto = requestBodyArg?.dto;
            const requestBodyRequired = requestBodyArg?.required;
            const requestBodyMedia = requestBodyArg?.media;
            const requestBodyHandler = requestBodyArg?.handler;
            const requestQueryDto = findQueryArg(args)?.dto;
            const joined = `${prefix}${route.path}`.replace(/\/+/g, '/');
            const path = joined.length > 1 ? joined.replace(/\/$/, '') : joined || '/';
            resolved.push({
                controllerClass,
                controllerName: controllerClass.name,
                handlerName,
                method: route.method,
                path,
                args,
                requestBodyDto,
                requestBodyRequired,
                requestBodyMedia,
                requestBodyHandler,
                requestQueryDto,
                responseDto: route.responseDto,
                binaryResponse: route.binaryResponse,
                successStatus: resolveSuccessStatus(controllerClass.name, handlerName, route.successStatus),
                apiKeyScope: route.apiKeyScope,
                summary: route.summary,
                description: route.description,
                tags: route.tags,
                errorResponses: route.errorResponses,
                deprecated: route.deprecated,
            });
        }
    }
    return resolved;
}
//# sourceMappingURL=public-api-route-resolver.js.map