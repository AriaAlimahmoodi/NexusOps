import type { BuiltTool } from '@n8n/agents';
import type { User } from '@n8n/db';
import { z } from 'zod';
import type { NodeTypes } from '../../../node-types';
import type { DynamicNodeParametersService } from '../../../services/dynamic-node-parameters.service';
declare const getResourceLocatorOptionsInputSchema: z.ZodObject<{
    nodeType: z.ZodString;
    nodeTypeVersion: z.ZodNumber;
    parameterPath: z.ZodString;
    nodeParameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>>>;
    filter: z.ZodOptional<z.ZodString>;
    paginationToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nodeType: string;
    nodeTypeVersion: number;
    parameterPath: string;
    nodeParameters?: Record<string, unknown> | undefined;
    credentials?: Record<string, {
        id: string;
        name: string;
    }> | undefined;
    filter?: string | undefined;
    paginationToken?: string | undefined;
}, {
    nodeType: string;
    nodeTypeVersion: number;
    parameterPath: string;
    nodeParameters?: Record<string, unknown> | undefined;
    credentials?: Record<string, {
        id: string;
        name: string;
    }> | undefined;
    filter?: string | undefined;
    paginationToken?: string | undefined;
}>;
export interface ResolveResourceLocatorOptionsDeps {
    dynamicNodeParametersService: DynamicNodeParametersService;
    nodeTypes: NodeTypes;
    user: User;
    projectId: string;
}
export type ResolveResourceLocatorOptionsInput = z.infer<typeof getResourceLocatorOptionsInputSchema>;
export declare function resolveResourceLocatorOptions({ nodeType, nodeTypeVersion, parameterPath, nodeParameters, credentials, filter, paginationToken, }: ResolveResourceLocatorOptionsInput, deps: ResolveResourceLocatorOptionsDeps): Promise<{
    ok: boolean;
    code: string;
    message: string;
    dynamicParameters?: undefined;
    credentialSlots?: undefined;
} | {
    ok: boolean;
    code: string;
    message: string;
    dynamicParameters: import("@n8n/ai-utilities/node-catalog").DynamicNodeParameterPath[];
    credentialSlots?: undefined;
} | {
    dynamicParameters?: undefined;
    ok: boolean;
    code: string;
    message: string;
    credentialSlots: import("@n8n/ai-utilities/node-catalog").RequiredNodeCredentialSlot[];
} | {
    code?: undefined;
    dynamicParameters?: undefined;
    message?: undefined;
    credentialSlots?: undefined;
    ok: boolean;
    kind: "resourceLocator";
    parameterPath: string;
    methodName: string;
    mode: string;
    results: {
        name: string;
        value: string | number | boolean;
        url?: string | undefined;
        parameterValue: import("n8n-workflow").INodeParameterResourceLocator;
    }[];
    paginationToken: string | undefined;
    builderHint?: string | undefined;
} | {
    code?: undefined;
    dynamicParameters?: undefined;
    message?: undefined;
    credentialSlots?: undefined;
    ok: boolean;
    kind: "loadOptionsMethod" | "loadOptionsRouting";
    parameterPath: string;
    methodName?: string | undefined;
    results: {
        name: string;
        value: string | number | boolean;
        description?: string | undefined;
        parameterValue: import("n8n-workflow").NodeParameterValue;
    }[];
    builderHint?: string | undefined;
}>;
export declare function buildGetResourceLocatorOptionsTool(deps: ResolveResourceLocatorOptionsDeps): BuiltTool;
export {};
