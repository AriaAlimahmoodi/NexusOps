import { z } from 'zod';
import type { OtlpProtocol } from './otel.constants';
export declare class OtelConfig {
    enabled: boolean;
    exporterProtocol: OtlpProtocol;
    exporterEndpoint: string;
    exporterTracingPath: string;
    exporterHeaders: string;
    exporterServiceName: string;
    tracesSampleRate: number;
    startupConnectivityTimeoutMs: number;
    includeNodeSpans: boolean;
    emitWorkflowStartSpan: boolean;
    emitNodeStartSpan: boolean;
    injectOutbound: boolean;
    productionExecutionsOnly: boolean;
}
declare const customAttributePrefixesSchema: z.ZodPipeline<z.ZodEffects<z.ZodString, unknown, string>, z.ZodObject<{
    project: z.ZodDefault<z.ZodString>;
    workflow: z.ZodDefault<z.ZodString>;
    node: z.ZodDefault<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    project: string;
    workflow: string;
    node: string;
}, {
    project?: string | undefined;
    workflow?: string | undefined;
    node?: string | undefined;
}>>;
export type CustomAttributePrefixes = z.infer<typeof customAttributePrefixesSchema>;
export declare class OtelCustomAttributesConfig {
    prefixes: CustomAttributePrefixes;
}
export {};
