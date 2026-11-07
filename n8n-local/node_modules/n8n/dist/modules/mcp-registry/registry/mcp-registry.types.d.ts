import { z } from 'zod';
import type { McpRegistryServerEntity } from './mcp-registry-server.entity';
export type McpRegistryServerUpsertRow = Pick<McpRegistryServerEntity, 'slug' | 'status' | 'version' | 'registryUpdatedAt' | 'data'>;
export declare const mcpRegistryExtendsCredentialSchema: z.ZodObject<{
    extends: z.ZodString;
    authUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    accessTokenUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    scope: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    authQueryParameters: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    grantType: z.ZodOptional<z.ZodNullable<z.ZodEnum<["authorizationCode", "clientCredentials", "pkce"]>>>;
    authentication: z.ZodOptional<z.ZodNullable<z.ZodEnum<["body", "header"]>>>;
    useDynamicClientRegistration: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    serverUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    customScopes: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    extends: string;
    authUrl?: string | null | undefined;
    accessTokenUrl?: string | null | undefined;
    scope?: string | null | undefined;
    authQueryParameters?: string | null | undefined;
    grantType?: "authorizationCode" | "clientCredentials" | "pkce" | null | undefined;
    authentication?: "body" | "header" | null | undefined;
    useDynamicClientRegistration?: boolean | null | undefined;
    serverUrl?: string | null | undefined;
    customScopes?: boolean | null | undefined;
}, {
    extends: string;
    authUrl?: string | null | undefined;
    accessTokenUrl?: string | null | undefined;
    scope?: string | null | undefined;
    authQueryParameters?: string | null | undefined;
    grantType?: "authorizationCode" | "clientCredentials" | "pkce" | null | undefined;
    authentication?: "body" | "header" | null | undefined;
    useDynamicClientRegistration?: boolean | null | undefined;
    serverUrl?: string | null | undefined;
    customScopes?: boolean | null | undefined;
}>;
export type McpRegistryExtendsCredential = z.infer<typeof mcpRegistryExtendsCredentialSchema>;
export declare const mcpRegistryUsesCredentialSchema: z.ZodObject<{
    credentialType: z.ZodString;
    name: z.ZodString;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    credentialType: string;
    name: string;
    value: string;
}, {
    credentialType: string;
    name: string;
    value: string;
}>;
export declare const mcpRegistryUsesCredentialsSchema: z.ZodEffects<z.ZodArray<z.ZodObject<{
    credentialType: z.ZodString;
    name: z.ZodString;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    credentialType: string;
    name: string;
    value: string;
}, {
    credentialType: string;
    name: string;
    value: string;
}>, "many">, {
    credentialType: string;
    name: string;
    value: string;
}[], {
    credentialType: string;
    name: string;
    value: string;
}[]>;
export type McpRegistryUsesCredential = z.infer<typeof mcpRegistryUsesCredentialSchema>;
export declare const mcpRegistryServerSchema: z.ZodIntersection<z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    tagline: z.ZodString;
    attribution: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | undefined, string | null | undefined>;
    version: z.ZodString;
    updatedAt: z.ZodString;
    icons: z.ZodArray<z.ZodObject<{
        src: z.ZodString;
        mimeType: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodEnum<["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"]>>>, NonNullable<"image/jpeg" | "image/jpg" | "image/png" | "image/svg+xml" | "image/webp"> | undefined, "image/jpeg" | "image/jpg" | "image/png" | "image/svg+xml" | "image/webp" | null | undefined>;
        theme: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodEnum<["light", "dark"]>>>, NonNullable<"dark" | "light"> | undefined, "dark" | "light" | null | undefined>;
    }, "strip", z.ZodTypeAny, {
        src: string;
        mimeType?: NonNullable<"image/jpeg" | "image/jpg" | "image/png" | "image/svg+xml" | "image/webp"> | undefined;
        theme?: NonNullable<"dark" | "light"> | undefined;
    }, {
        src: string;
        mimeType?: "image/jpeg" | "image/jpg" | "image/png" | "image/svg+xml" | "image/webp" | null | undefined;
        theme?: "dark" | "light" | null | undefined;
    }>, "many">;
    websiteUrl: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | undefined, string | null | undefined>;
    remotes: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["streamable-http", "sse", "streamable-http-templated"]>;
        url: z.ZodString;
        headers: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodString>>>, Record<string, string> | undefined, Record<string, string> | null | undefined>;
    }, "strip", z.ZodTypeAny, {
        type: "sse" | "streamable-http" | "streamable-http-templated";
        url: string;
        headers?: Record<string, string> | undefined;
    }, {
        type: "sse" | "streamable-http" | "streamable-http-templated";
        url: string;
        headers?: Record<string, string> | null | undefined;
    }>, "many">;
    tools: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        title: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | undefined, string | null | undefined>;
        annotations: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodObject<{
            readOnlyHint: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodBoolean>>, boolean | undefined, boolean | null | undefined>;
            destructiveHint: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodBoolean>>, boolean | undefined, boolean | null | undefined>;
            idempotentHint: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodBoolean>>, boolean | undefined, boolean | null | undefined>;
            openWorldHint: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodBoolean>>, boolean | undefined, boolean | null | undefined>;
        }, "strip", z.ZodTypeAny, {
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        }, {
            readOnlyHint?: boolean | null | undefined;
            destructiveHint?: boolean | null | undefined;
            idempotentHint?: boolean | null | undefined;
            openWorldHint?: boolean | null | undefined;
        }>>>, {
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined, {
            readOnlyHint?: boolean | null | undefined;
            destructiveHint?: boolean | null | undefined;
            idempotentHint?: boolean | null | undefined;
            openWorldHint?: boolean | null | undefined;
        } | null | undefined>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        title?: string | undefined;
        annotations?: {
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
    }, {
        name: string;
        title?: string | null | undefined;
        annotations?: {
            readOnlyHint?: boolean | null | undefined;
            destructiveHint?: boolean | null | undefined;
            idempotentHint?: boolean | null | undefined;
            openWorldHint?: boolean | null | undefined;
        } | null | undefined;
    }>, "many">;
    isOfficial: z.ZodBoolean;
    origin: z.ZodLiteral<"registry">;
    status: z.ZodEnum<["active", "deprecated"]>;
    requiredCapabilities: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>, string[] | undefined, string[] | null | undefined>;
    tags: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodObject<{
        data: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        data?: string[] | null | undefined;
    }, {
        data?: string[] | null | undefined;
    }>]>>>, string[] | undefined, string[] | {
        data?: string[] | null | undefined;
    } | null | undefined>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    title: string;
    description: string;
    tagline: string;
    attribution?: string | undefined;
    version: string;
    updatedAt: string;
    icons: {
        src: string;
        mimeType?: NonNullable<"image/jpeg" | "image/jpg" | "image/png" | "image/svg+xml" | "image/webp"> | undefined;
        theme?: NonNullable<"dark" | "light"> | undefined;
    }[];
    websiteUrl?: string | undefined;
    remotes: {
        type: "sse" | "streamable-http" | "streamable-http-templated";
        url: string;
        headers?: Record<string, string> | undefined;
    }[];
    tools: {
        name: string;
        title?: string | undefined;
        annotations?: {
            readOnlyHint?: boolean | undefined;
            destructiveHint?: boolean | undefined;
            idempotentHint?: boolean | undefined;
            openWorldHint?: boolean | undefined;
        } | undefined;
    }[];
    isOfficial: boolean;
    origin: "registry";
    status: "active" | "deprecated";
    requiredCapabilities?: string[] | undefined;
    tags?: string[] | undefined;
}, {
    name: string;
    slug: string;
    title: string;
    description: string;
    tagline: string;
    attribution?: string | null | undefined;
    version: string;
    updatedAt: string;
    icons: {
        src: string;
        mimeType?: "image/jpeg" | "image/jpg" | "image/png" | "image/svg+xml" | "image/webp" | null | undefined;
        theme?: "dark" | "light" | null | undefined;
    }[];
    websiteUrl?: string | null | undefined;
    remotes: {
        type: "sse" | "streamable-http" | "streamable-http-templated";
        url: string;
        headers?: Record<string, string> | null | undefined;
    }[];
    tools: {
        name: string;
        title?: string | null | undefined;
        annotations?: {
            readOnlyHint?: boolean | null | undefined;
            destructiveHint?: boolean | null | undefined;
            idempotentHint?: boolean | null | undefined;
            openWorldHint?: boolean | null | undefined;
        } | null | undefined;
    }[];
    isOfficial: boolean;
    origin: "registry";
    status: "active" | "deprecated";
    requiredCapabilities?: string[] | null | undefined;
    tags?: string[] | {
        data?: string[] | null | undefined;
    } | null | undefined;
}>, z.ZodDiscriminatedUnion<"authType", [z.ZodObject<{
    authType: z.ZodLiteral<"oauth2">;
}, "strip", z.ZodTypeAny, {
    authType: "oauth2";
}, {
    authType: "oauth2";
}>, z.ZodObject<{
    authType: z.ZodLiteral<"extendsCredential">;
    extendsCredential: z.ZodObject<{
        extends: z.ZodString;
        authUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        accessTokenUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        scope: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        authQueryParameters: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        grantType: z.ZodOptional<z.ZodNullable<z.ZodEnum<["authorizationCode", "clientCredentials", "pkce"]>>>;
        authentication: z.ZodOptional<z.ZodNullable<z.ZodEnum<["body", "header"]>>>;
        useDynamicClientRegistration: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        serverUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        customScopes: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        extends: string;
        authUrl?: string | null | undefined;
        accessTokenUrl?: string | null | undefined;
        scope?: string | null | undefined;
        authQueryParameters?: string | null | undefined;
        grantType?: "authorizationCode" | "clientCredentials" | "pkce" | null | undefined;
        authentication?: "body" | "header" | null | undefined;
        useDynamicClientRegistration?: boolean | null | undefined;
        serverUrl?: string | null | undefined;
        customScopes?: boolean | null | undefined;
    }, {
        extends: string;
        authUrl?: string | null | undefined;
        accessTokenUrl?: string | null | undefined;
        scope?: string | null | undefined;
        authQueryParameters?: string | null | undefined;
        grantType?: "authorizationCode" | "clientCredentials" | "pkce" | null | undefined;
        authentication?: "body" | "header" | null | undefined;
        useDynamicClientRegistration?: boolean | null | undefined;
        serverUrl?: string | null | undefined;
        customScopes?: boolean | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    authType: "extendsCredential";
    extendsCredential: {
        extends: string;
        authUrl?: string | null | undefined;
        accessTokenUrl?: string | null | undefined;
        scope?: string | null | undefined;
        authQueryParameters?: string | null | undefined;
        grantType?: "authorizationCode" | "clientCredentials" | "pkce" | null | undefined;
        authentication?: "body" | "header" | null | undefined;
        useDynamicClientRegistration?: boolean | null | undefined;
        serverUrl?: string | null | undefined;
        customScopes?: boolean | null | undefined;
    };
}, {
    authType: "extendsCredential";
    extendsCredential: {
        extends: string;
        authUrl?: string | null | undefined;
        accessTokenUrl?: string | null | undefined;
        scope?: string | null | undefined;
        authQueryParameters?: string | null | undefined;
        grantType?: "authorizationCode" | "clientCredentials" | "pkce" | null | undefined;
        authentication?: "body" | "header" | null | undefined;
        useDynamicClientRegistration?: boolean | null | undefined;
        serverUrl?: string | null | undefined;
        customScopes?: boolean | null | undefined;
    };
}>, z.ZodObject<{
    authType: z.ZodLiteral<"usesCredentials">;
    usesCredentials: z.ZodEffects<z.ZodArray<z.ZodObject<{
        credentialType: z.ZodString;
        name: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        credentialType: string;
        name: string;
        value: string;
    }, {
        credentialType: string;
        name: string;
        value: string;
    }>, "many">, {
        credentialType: string;
        name: string;
        value: string;
    }[], {
        credentialType: string;
        name: string;
        value: string;
    }[]>;
}, "strip", z.ZodTypeAny, {
    authType: "usesCredentials";
    usesCredentials: {
        credentialType: string;
        name: string;
        value: string;
    }[];
}, {
    authType: "usesCredentials";
    usesCredentials: {
        credentialType: string;
        name: string;
        value: string;
    }[];
}>]>>;
export type McpRegistryServer = z.output<typeof mcpRegistryServerSchema>;
export type McpRegistryIcon = McpRegistryServer['icons'][number];
export type McpRegistryRemote = McpRegistryServer['remotes'][number];
export type McpRegistryRemoteType = McpRegistryRemote['type'];
export type McpRegistryTool = McpRegistryServer['tools'][number];
export type McpRegistryToolAnnotations = NonNullable<McpRegistryTool['annotations']>;
export declare function parseMcpRegistryServer(value: unknown): McpRegistryServer | null;
export declare function toEntity(server: McpRegistryServer): McpRegistryServerUpsertRow;
export declare function fromEntity(entity: McpRegistryServerEntity): McpRegistryServer;
