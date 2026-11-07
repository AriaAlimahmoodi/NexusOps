import './zod-extend';
import '../controllers';
import type { RouteConfig } from '@asteasolutions/zod-to-openapi';
import type { BinaryResponse, ResponseDtoClass } from '@n8n/decorators';
import { z } from 'zod';
import type { ResolvedPublicApiRoute } from '../../../public-api/public-api-route-resolver';
export declare const ERROR_RESPONSE_REFS: {
    readonly 400: {
        readonly $ref: '../../../../shared/spec/responses/badRequest.yml';
    };
    readonly 401: {
        readonly $ref: '../../../../shared/spec/responses/unauthorized.yml';
    };
    readonly 402: {
        readonly $ref: '../../../../shared/spec/responses/paymentRequired.yml';
    };
    readonly 403: {
        readonly $ref: '../../../../shared/spec/responses/forbidden.yml';
    };
    readonly 404: {
        readonly $ref: '../../../../shared/spec/responses/notFound.yml';
    };
    readonly 409: {
        readonly $ref: '../../../../shared/spec/responses/conflict.yml';
    };
    readonly 413: {
        readonly $ref: '../../../../shared/spec/responses/contentTooLarge.yml';
    };
    readonly 415: {
        readonly $ref: '../../../../shared/spec/responses/unsupportedMediaType.yml';
    };
    readonly 422: {
        readonly $ref: '../../../../shared/spec/responses/unprocessableEntity.yml';
    };
    readonly 500: {
        readonly $ref: '../../../../shared/spec/responses/internalServerError.yml';
    };
    readonly 503: {
        readonly $ref: '../../../../shared/spec/responses/serviceUnavailable.yml';
    };
};
type DocumentedErrorStatus = keyof typeof ERROR_RESPONSE_REFS;
export declare const ERROR_RESPONSE_DESCRIPTIONS: Record<DocumentedErrorStatus, string>;
export type NamedResponseDto = ResponseDtoClass & {
    schema: z.ZodTypeAny;
    name: string;
};
export type SchemaResolver = (dto: NamedResponseDto, schema: z.ZodTypeAny) => z.ZodTypeAny;
export declare function getSharedResponseSchemas(): Map<NamedResponseDto, z.ZodTypeAny>;
export declare function buildRequestBodyJsonSchema(route: ResolvedPublicApiRoute): Record<string, unknown> | undefined;
export declare function buildBinarySuccessResponse({ mediaType, description, headers }: BinaryResponse): {
    description: string;
    headers: Record<string, {
        description: string;
        required: true;
        schema: {
            type: 'string';
        };
    }> | undefined;
    content: {
        "application/gzip": {
            schema: {
                type: 'string';
                format: string;
            };
        };
    };
};
export declare function buildJsonSuccessResponse(responseDto: ResponseDtoClass | undefined, resolveSchema: SchemaResolver): {
    description: string;
    content: {
        'application/json': {
            schema: z.ZodTypeAny;
        };
    } | undefined;
};
export interface GeneratedDecoratorOperation {
    outputPath: string;
    pathKey: string;
    method: RouteConfig['method'];
    config: RouteConfig;
}
export declare function getDecoratorGeneratedOperations(resolveSchema?: SchemaResolver): GeneratedDecoratorOperation[];
export {};
