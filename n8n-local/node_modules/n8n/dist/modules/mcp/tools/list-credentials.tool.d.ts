import type { User } from '@n8n/db';
import z from 'zod';
import type { CredentialsService } from '../../../credentials/credentials.service';
import type { AiGatewayService } from '../../../services/ai-gateway.service';
import type { Telemetry } from '../../../telemetry';
import type { N8nConnectCoverage, ToolDefinition } from '../mcp.types';
declare const inputSchema: {
    limit: z.ZodOptional<z.ZodNumber>;
    query: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    onlySharedWithMe: z.ZodOptional<z.ZodBoolean>;
};
declare const createOutputSchema: (descriptionsEnabled: boolean) => {
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodString;
        description?: z.ZodNullable<z.ZodString> | undefined;
        scopes: z.ZodArray<z.ZodString, "many">;
        isManaged: z.ZodBoolean;
        isGlobal: z.ZodBoolean;
        homeProject: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            type: string;
        }, {
            id: string;
            name: string;
            type: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        type: string;
        description?: unknown;
        scopes: string[];
        isManaged: boolean;
        isGlobal: boolean;
        homeProject: {
            id: string;
            name: string;
            type: string;
        } | null;
    }, {
        id: string;
        name: string;
        type: string;
        description?: unknown;
        scopes: string[];
        isManaged: boolean;
        isGlobal: boolean;
        homeProject: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>, "many">;
    count: z.ZodNumber;
    gatewayCredits: z.ZodOptional<z.ZodObject<{
        credentialTypes: z.ZodArray<z.ZodString, "many">;
        nodes: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        credentialTypes: string[];
        nodes: string[];
    }, {
        credentialTypes: string[];
        nodes: string[];
    }>>;
    error: z.ZodOptional<z.ZodString>;
};
export type ListCredentialsParams = {
    limit?: number;
    query?: string;
    type?: string;
    projectId?: string;
    onlySharedWithMe?: boolean;
};
export type ListCredentialsItem = z.infer<ReturnType<typeof createOutputSchema>['data']>[number];
export type ListCredentialsResult = {
    data: ListCredentialsItem[];
    count: number;
    gatewayCredits?: N8nConnectCoverage;
    error?: string;
};
export declare const createListCredentialsTool: (user: User, credentialsService: CredentialsService, telemetry: Telemetry, aiGatewayService: AiGatewayService, descriptionsEnabled?: boolean) => ToolDefinition<typeof inputSchema>;
export declare function listCredentials(user: User, credentialsService: CredentialsService, { limit, query, type, projectId, onlySharedWithMe }: ListCredentialsParams, descriptionsEnabled?: boolean): Promise<ListCredentialsResult>;
export {};
