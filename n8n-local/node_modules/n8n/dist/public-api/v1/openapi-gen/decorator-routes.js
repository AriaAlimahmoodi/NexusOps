"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_RESPONSE_DESCRIPTIONS = exports.ERROR_RESPONSE_REFS = void 0;
exports.getSharedResponseSchemas = getSharedResponseSchemas;
exports.buildRequestBodyJsonSchema = buildRequestBodyJsonSchema;
exports.buildBinarySuccessResponse = buildBinarySuccessResponse;
exports.buildJsonSuccessResponse = buildJsonSuccessResponse;
exports.getDecoratorGeneratedOperations = getDecoratorGeneratedOperations;
require("./zod-extend");
require("../controllers");
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const idempotency_request_1 = require("../../../idempotency/idempotency-request");
const public_api_route_resolver_1 = require("../../../public-api/public-api-route-resolver");
const schema_modifiers_1 = require("./schema-modifiers");
const REQUEST_BODY_COMPONENT = 'RequestBody';
const IDEMPOTENCY_KEY_PARAMETER = {
    $ref: '../../../../shared/spec/parameters/idempotencyKey.yml',
};
const SHARED_PAGINATION_PARAMS = {
    limit: { $ref: '../../../../shared/spec/parameters/limit.yml' },
    cursor: { $ref: '../../../../shared/spec/parameters/cursor.yml' },
    offset: { $ref: '../../../../shared/spec/parameters/offset.yml' },
};
exports.ERROR_RESPONSE_REFS = {
    400: { $ref: '../../../../shared/spec/responses/badRequest.yml' },
    401: { $ref: '../../../../shared/spec/responses/unauthorized.yml' },
    402: { $ref: '../../../../shared/spec/responses/paymentRequired.yml' },
    403: { $ref: '../../../../shared/spec/responses/forbidden.yml' },
    404: { $ref: '../../../../shared/spec/responses/notFound.yml' },
    409: { $ref: '../../../../shared/spec/responses/conflict.yml' },
    413: { $ref: '../../../../shared/spec/responses/contentTooLarge.yml' },
    415: { $ref: '../../../../shared/spec/responses/unsupportedMediaType.yml' },
    422: { $ref: '../../../../shared/spec/responses/unprocessableEntity.yml' },
    500: { $ref: '../../../../shared/spec/responses/internalServerError.yml' },
    503: { $ref: '../../../../shared/spec/responses/serviceUnavailable.yml' },
};
function isDocumentedErrorStatus(status) {
    return status in exports.ERROR_RESPONSE_REFS;
}
exports.ERROR_RESPONSE_DESCRIPTIONS = {
    400: 'The request is invalid or provides malformed data.',
    401: 'Unauthorized',
    402: 'Payment required',
    403: 'Forbidden',
    404: 'The specified resource was not found.',
    409: 'Conflict',
    413: 'Content too large.',
    415: 'Unsupported media type.',
    422: 'Unprocessable Entity',
    500: 'Internal server error.',
    503: 'The requested service is temporarily unavailable.',
};
function hasNamedSchema(dto) {
    if (dto === null || (typeof dto !== 'object' && typeof dto !== 'function')) {
        return false;
    }
    return 'schema' in dto && 'name' in dto && typeof dto.name === 'string';
}
const inlineResolver = (_dto, schema) => schema;
function getSharedResponseSchemas() {
    const seen = new Set();
    const shared = new Map();
    for (const route of (0, public_api_route_resolver_1.resolvePublicApiRoutes)()) {
        if (!route.responseDto || !hasNamedSchema(route.responseDto)) {
            continue;
        }
        const dto = route.responseDto;
        if (seen.has(dto) && !shared.has(dto)) {
            shared.set(dto, dto.schema);
        }
        else {
            seen.add(dto);
        }
    }
    return shared;
}
function buildQueryConfig(route) {
    if (!route.requestQueryDto)
        return {};
    const shape = route.requestQueryDto.schema.shape;
    const generatedShape = {};
    const parameters = [];
    for (const [key, fieldSchema] of Object.entries(shape)) {
        const sharedParam = SHARED_PAGINATION_PARAMS[key];
        if (sharedParam) {
            parameters.push(sharedParam);
            continue;
        }
        generatedShape[key] = fieldSchema;
    }
    return {
        parameters: parameters.length ? parameters : undefined,
        requestQuery: Object.keys(generatedShape).length ? zod_1.z.object(generatedShape) : undefined,
    };
}
function buildPathParams(route) {
    const shape = {};
    for (const arg of route.args) {
        if (arg.type === 'param')
            shape[arg.key] = arg.schema ?? zod_1.z.string();
    }
    return Object.keys(shape).length ? zod_1.z.object(shape) : undefined;
}
function buildRequestBody(route) {
    if (!route.requestBodyDto || !route.requestBodyHandler) {
        return undefined;
    }
    const required = route.requestBodyRequired ?? (0, public_api_route_resolver_1.isRequestBodyRequired)(route.requestBodyDto);
    const handler = route.requestBodyHandler;
    return {
        ...(required ? { required: true } : {}),
        content: {
            [handler.mediaType]: {
                schema: route.requestBodyDto.schema,
            },
        },
    };
}
function buildRequestBodyJsonSchema(route) {
    if (!route.requestBodyDto)
        return undefined;
    const registry = new zod_to_openapi_1.OpenAPIRegistry();
    registry.register(REQUEST_BODY_COMPONENT, route.requestBodyDto.schema);
    const { components } = new zod_to_openapi_1.OpenApiGeneratorV3(registry.definitions).generateComponents();
    const schema = components?.schemas?.[REQUEST_BODY_COMPONENT];
    (0, schema_modifiers_1.applySchemaModifiers)(schema);
    return (0, is_record_1.isRecord)(schema) ? schema : undefined;
}
function buildBinarySuccessResponse({ mediaType, description, headers }) {
    const responseHeaders = {};
    for (const [name, header] of Object.entries(headers ?? {})) {
        responseHeaders[name] = {
            description: header.description,
            required: true,
            schema: { type: 'string' },
        };
    }
    return {
        description: description ?? 'Operation successful.',
        headers: Object.keys(responseHeaders).length ? responseHeaders : undefined,
        content: {
            [mediaType]: { schema: { type: 'string', format: 'binary' } },
        },
    };
}
function buildJsonSuccessResponse(responseDto, resolveSchema) {
    const hasResponseContent = responseDto && hasNamedSchema(responseDto);
    return {
        description: 'Operation successful.',
        content: hasResponseContent
            ? {
                'application/json': {
                    schema: resolveSchema(responseDto, responseDto.schema),
                },
            }
            : undefined,
    };
}
function buildResponses(route, resolveSchema) {
    const responses = {
        [route.successStatus]: route.binaryResponse
            ? buildBinarySuccessResponse(route.binaryResponse)
            : buildJsonSuccessResponse(route.responseDto, resolveSchema),
    };
    if (route.requestBodyDto ?? route.requestQueryDto) {
        responses[400] = exports.ERROR_RESPONSE_REFS[400];
    }
    if (route.requestBodyDto && route.requestBodyHandler) {
        const handler = route.requestBodyHandler;
        for (const status of handler.errorStatuses) {
            if (!isDocumentedErrorStatus(status)) {
                throw new n8n_workflow_1.UnexpectedError(`Request-body media type ${handler.mediaType} declares undocumented error status ` +
                    `${status} - add a shared response file and register it in ERROR_RESPONSE_REFS.`);
            }
            responses[status] = exports.ERROR_RESPONSE_REFS[status];
        }
    }
    responses[401] = exports.ERROR_RESPONSE_REFS[401];
    if (route.apiKeyScope) {
        responses[403] = exports.ERROR_RESPONSE_REFS[403];
    }
    for (const { status, dto, description } of route.errorResponses ?? []) {
        if (!isDocumentedErrorStatus(status)) {
            throw new n8n_workflow_1.UnexpectedError(`@ApiErrorResponse(${status}) on ${route.controllerName}.${route.handlerName} has no ` +
                'matching shared response file in ERROR_RESPONSE_REFS - add one to shared/spec/responses/ ' +
                'and register it there.');
        }
        const ref = exports.ERROR_RESPONSE_REFS[status];
        if (dto && hasNamedSchema(dto)) {
            responses[status] = {
                description: description ?? exports.ERROR_RESPONSE_DESCRIPTIONS[status],
                content: { 'application/json': { schema: dto.schema } },
            };
        }
        else if (description) {
            responses[status] = { description };
        }
        else {
            responses[status] = ref;
        }
    }
    if ((0, idempotency_request_1.honorsIdempotencyKey)(route.method, route.path)) {
        responses[400] ??= exports.ERROR_RESPONSE_REFS[400];
        responses[409] ??= exports.ERROR_RESPONSE_REFS[409];
        responses[422] ??= exports.ERROR_RESPONSE_REFS[422];
    }
    return responses;
}
function getDecoratorGeneratedOperations(resolveSchema = inlineResolver) {
    const publicApiRoutes = (0, public_api_route_resolver_1.resolvePublicApiRoutes)();
    return publicApiRoutes.map((route) => {
        const pathKey = (0, public_api_route_resolver_1.toOpenApiPathTemplate)(route.path);
        const { parameters: queryParameters, requestQuery } = buildQueryConfig(route);
        const parameters = queryParameters ?? [];
        if ((0, idempotency_request_1.honorsIdempotencyKey)(route.method, route.path)) {
            parameters.push(IDEMPOTENCY_KEY_PARAMETER);
        }
        const requestParams = buildPathParams(route);
        const requestBody = buildRequestBody(route);
        const resource = route.path.split('/').find(Boolean) ?? 'root';
        const config = {
            method: route.method,
            path: pathKey,
            operationId: route.handlerName,
            ...(route.tags?.length ? { tags: route.tags } : {}),
            ...(route.summary ? { summary: route.summary } : {}),
            ...(route.description ? { description: route.description } : {}),
            ...(route.apiKeyScope
                ? { 'x-required-scope': (0, public_api_route_resolver_1.scopeRequirementToString)(route.apiKeyScope) }
                : {}),
            ...(route.deprecated ? { deprecated: true } : {}),
            ...(parameters.length ? { parameters } : {}),
            ...((requestParams ?? requestQuery ?? requestBody)
                ? {
                    request: {
                        ...(requestParams ? { params: requestParams } : {}),
                        ...(requestQuery ? { query: requestQuery } : {}),
                        ...(requestBody ? { body: requestBody } : {}),
                    },
                }
                : {}),
            responses: buildResponses(route, resolveSchema),
        };
        return {
            outputPath: `handlers/${resource}/spec/paths/${route.handlerName}.generated.yml`,
            pathKey,
            method: route.method,
            config,
        };
    });
}
//# sourceMappingURL=decorator-routes.js.map