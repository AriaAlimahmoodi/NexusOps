import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { RouteConfig } from '@asteasolutions/zod-to-openapi';
import type { z } from 'zod';
import { type NamedResponseDto } from './decorator-routes';
export declare const DECORATOR_ROOT_FILENAME = "openapi.decorator-routes.generated.yml";
export interface OpenApiDocument {
    paths?: Record<string, Record<string, unknown>>;
    components?: Record<string, Record<string, unknown>>;
    [key: string]: unknown;
}
export interface GeneratedArtifact {
    outputPath: string;
    content: string;
}
interface OperationTarget {
    outputPath: string;
    pathKey: string;
    method: RouteConfig['method'];
}
export declare function buildArtifactsFromRegistry(registry: OpenAPIRegistry, operations: OperationTarget[]): GeneratedArtifact[];
export declare function registerSharedSchemas(registry: OpenAPIRegistry, sharedResponseSchemas: Map<NamedResponseDto, z.ZodTypeAny>): Map<NamedResponseDto, z.ZodTypeAny>;
export declare function getGeneratedArtifacts(): GeneratedArtifact[];
export declare function generateDocs(v1Dir: string): void;
export declare function assembleSpec(envelope: OpenApiDocument, generated: OpenApiDocument): OpenApiDocument;
export {};
