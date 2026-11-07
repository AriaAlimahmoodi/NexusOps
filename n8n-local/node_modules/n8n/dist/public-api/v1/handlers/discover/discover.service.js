"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDiscoverResponse = buildDiscoverResponse;
exports._resetCache = _resetCache;
const public_api_route_resolver_1 = require("../../../public-api-route-resolver");
const decorator_routes_1 = require("../../openapi-gen/decorator-routes");
require("../../controllers");
let cachedEndpoints;
function buildEndpoints() {
    return (0, public_api_route_resolver_1.resolvePublicApiRoutes)().map((route) => ({
        method: route.method.toUpperCase(),
        path: `/api/v1${(0, public_api_route_resolver_1.toOpenApiPathTemplate)(route.path)}`,
        operationId: route.handlerName,
        tag: route.tags?.[0] ?? 'Other',
        scope: route.apiKeyScope ?? null,
        requestSchema: route.requestBodyHandler?.discoverable
            ? (0, decorator_routes_1.buildRequestBodyJsonSchema)(route)
            : undefined,
    }));
}
async function buildDiscoverResponse(callerScopes, options) {
    if (!cachedEndpoints) {
        cachedEndpoints = buildEndpoints();
    }
    const allEndpoints = cachedEndpoints;
    const includeSchemas = options?.includeSchemas === true;
    const filtered = allEndpoints.filter((ep) => ep.scope === null || (0, public_api_route_resolver_1.apiKeyScopesSatisfy)(callerScopes, ep.scope));
    const operationsOf = (scope) => scope === null
        ? []
        : (0, public_api_route_resolver_1.scopesInRequirement)(scope)
            .map((s) => s.split(':')[1])
            .filter((operation) => Boolean(operation));
    const resources = {};
    for (const ep of filtered) {
        const resourceKey = ep.tag.toLowerCase();
        if (!resources[resourceKey]) {
            resources[resourceKey] = { operations: [], endpoints: [] };
        }
        const entry = {
            method: ep.method,
            path: ep.path,
            operationId: ep.operationId,
        };
        if (includeSchemas && ep.requestSchema) {
            entry.requestSchema = ep.requestSchema;
        }
        resources[resourceKey].endpoints.push(entry);
        for (const operation of operationsOf(ep.scope)) {
            if (!resources[resourceKey].operations.includes(operation)) {
                resources[resourceKey].operations.push(operation);
            }
        }
    }
    const resourceFilter = options?.resource?.toLowerCase();
    const operationFilter = options?.operation?.toLowerCase();
    let filteredResources = resources;
    if (resourceFilter) {
        const match = filteredResources[resourceFilter];
        filteredResources = match ? { [resourceFilter]: match } : {};
    }
    if (operationFilter) {
        const operationsByOperationId = new Map(filtered.map((f) => [
            f.operationId,
            new Set(operationsOf(f.scope).map((operation) => operation.toLowerCase())),
        ]));
        const result = {};
        for (const [key, info] of Object.entries(filteredResources)) {
            const matchingEndpoints = info.endpoints.filter((ep) => operationsByOperationId.get(ep.operationId)?.has(operationFilter));
            if (matchingEndpoints.length > 0) {
                result[key] = {
                    operations: info.operations.filter((o) => o.toLowerCase() === operationFilter),
                    endpoints: matchingEndpoints,
                };
            }
        }
        filteredResources = result;
    }
    const allOperations = [...new Set(Object.values(resources).flatMap((r) => r.operations))];
    return {
        scopes: [...callerScopes],
        resources: filteredResources,
        filters: {
            resource: {
                description: 'Filter to a specific resource',
                values: Object.keys(resources),
            },
            operation: {
                description: 'Filter to a specific operation',
                values: allOperations,
            },
            include: {
                description: 'Include additional data',
                values: ['schemas'],
            },
        },
        specUrl: '/api/v1/openapi.yml',
    };
}
function _resetCache() {
    cachedEndpoints = undefined;
}
//# sourceMappingURL=discover.service.js.map