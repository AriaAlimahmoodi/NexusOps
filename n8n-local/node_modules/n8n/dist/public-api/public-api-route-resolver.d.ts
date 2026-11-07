import type { ZodClass } from '@n8n/api-types';
import type { ApiKeyScopeRequirement, Arg, BinaryResponse, Controller, DeprecationInfo, ErrorResponse, HandlerName, Method, RequestBodyMedia, ResponseDtoClass, SuccessStatus } from '@n8n/decorators';
import type { ApiKeyScope } from '@n8n/permissions';
import type { ZodTypeAny } from 'zod';
import type { RequestBodyHandler } from '../public-api/media-types/request-body';
export type ParamArg = {
    type: 'param';
    key: string;
    schema?: ZodTypeAny;
};
export type BodyArg = {
    type: 'body';
    dto: ZodClass;
    required?: boolean;
    media: RequestBodyMedia;
    handler: RequestBodyHandler;
};
type QueryArg = {
    type: 'query';
    dto: ZodClass;
};
export type ValidatedParamArg = ParamArg & {
    schema: ZodTypeAny;
};
export type ResolvedRouteArg = ParamArg | BodyArg | QueryArg;
export declare function findBodyArg(args: ResolvedRouteArg[]): BodyArg | undefined;
export declare function findValidatedParamArgs(args: ResolvedRouteArg[]): ValidatedParamArg[];
export interface ResolvedPublicApiRoute {
    controllerClass: Controller;
    controllerName: string;
    handlerName: HandlerName;
    method: Method;
    path: string;
    args: ResolvedRouteArg[];
    requestBodyDto?: ZodClass;
    requestBodyRequired?: boolean;
    requestBodyMedia?: RequestBodyMedia;
    requestBodyHandler?: RequestBodyHandler;
    requestQueryDto?: ZodClass;
    responseDto?: ResponseDtoClass;
    binaryResponse?: BinaryResponse;
    successStatus: SuccessStatus;
    apiKeyScope?: ApiKeyScopeRequirement;
    summary?: string;
    description?: string;
    tags?: string[];
    errorResponses?: ErrorResponse[];
    deprecated?: DeprecationInfo;
}
export declare function resolveRouteArgs(controllerClass: Controller, handlerName: HandlerName, args: Arg[]): ResolvedRouteArg[];
export declare function isRequestBodyRequired(dto: ZodClass): boolean;
export declare function resolveSuccessStatus(controllerName: string, handlerName: HandlerName, successStatus: SuccessStatus | undefined): SuccessStatus;
export declare function apiKeyScopesSatisfy(granted: readonly string[] | undefined, requirement: ApiKeyScopeRequirement): boolean;
export declare function scopesInRequirement(requirement: ApiKeyScopeRequirement): readonly ApiKeyScope[];
export declare function scopeRequirementToString(requirement: ApiKeyScopeRequirement): string;
export declare function toOpenApiPathTemplate(path: string): string;
export declare function resolvePublicApiRoutes(): ResolvedPublicApiRoute[];
export {};
