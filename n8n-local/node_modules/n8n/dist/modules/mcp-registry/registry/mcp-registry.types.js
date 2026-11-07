"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpRegistryServerSchema = exports.mcpRegistryUsesCredentialsSchema = exports.mcpRegistryUsesCredentialSchema = exports.mcpRegistryExtendsCredentialSchema = void 0;
exports.parseMcpRegistryServer = parseMcpRegistryServer;
exports.toEntity = toEntity;
exports.fromEntity = fromEntity;
const zod_1 = require("zod");
const serverStatuses = ['active', 'deprecated'];
const optionalField = (schema) => schema.nullish().transform((value) => value ?? undefined);
exports.mcpRegistryExtendsCredentialSchema = zod_1.z.object({
    extends: zod_1.z.string(),
    authUrl: zod_1.z.string().nullish(),
    accessTokenUrl: zod_1.z.string().nullish(),
    scope: zod_1.z.string().nullish(),
    authQueryParameters: zod_1.z.string().nullish(),
    grantType: zod_1.z.enum(['authorizationCode', 'clientCredentials', 'pkce']).nullish(),
    authentication: zod_1.z.enum(['body', 'header']).nullish(),
    useDynamicClientRegistration: zod_1.z.boolean().nullish(),
    serverUrl: zod_1.z.string().nullish(),
    customScopes: zod_1.z.boolean().nullish(),
});
exports.mcpRegistryUsesCredentialSchema = zod_1.z.object({
    credentialType: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    value: zod_1.z.string().min(1),
});
exports.mcpRegistryUsesCredentialsSchema = zod_1.z
    .array(exports.mcpRegistryUsesCredentialSchema)
    .min(1)
    .superRefine((credentials, ctx) => {
    const credentialTypes = new Set();
    const values = new Set();
    for (const [index, credential] of credentials.entries()) {
        if (credentialTypes.has(credential.credentialType)) {
            ctx.addIssue({
                code: 'custom',
                message: 'Credential types must be unique',
                path: [index, 'credentialType'],
            });
        }
        if (values.has(credential.value)) {
            ctx.addIssue({
                code: 'custom',
                message: 'Credential selector values must be unique',
                path: [index, 'value'],
            });
        }
        credentialTypes.add(credential.credentialType);
        values.add(credential.value);
    }
});
const mcpRegistryServerBaseSchema = zod_1.z.object({
    name: zod_1.z.string(),
    slug: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    tagline: zod_1.z.string(),
    attribution: optionalField(zod_1.z.string()),
    version: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    icons: zod_1.z.array(zod_1.z.object({
        src: zod_1.z.string(),
        mimeType: optionalField(zod_1.z.enum(['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'])),
        theme: optionalField(zod_1.z.enum(['light', 'dark'])),
    })),
    websiteUrl: optionalField(zod_1.z.string()),
    remotes: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['streamable-http', 'sse', 'streamable-http-templated']),
        url: zod_1.z.string(),
        headers: optionalField(zod_1.z.record(zod_1.z.string(), zod_1.z.string())),
    })),
    tools: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        title: optionalField(zod_1.z.string()),
        annotations: optionalField(zod_1.z.object({
            readOnlyHint: optionalField(zod_1.z.boolean()),
            destructiveHint: optionalField(zod_1.z.boolean()),
            idempotentHint: optionalField(zod_1.z.boolean()),
            openWorldHint: optionalField(zod_1.z.boolean()),
        })),
    })),
    isOfficial: zod_1.z.boolean(),
    origin: zod_1.z.literal('registry'),
    status: zod_1.z.enum(serverStatuses),
    requiredCapabilities: optionalField(zod_1.z.array(zod_1.z.string())),
    tags: zod_1.z
        .union([zod_1.z.array(zod_1.z.string()), zod_1.z.object({ data: zod_1.z.array(zod_1.z.string()).nullish() })])
        .nullish()
        .transform((value) => (Array.isArray(value) ? value : (value?.data ?? undefined))),
});
const mcpRegistryServerAuthSchema = zod_1.z.discriminatedUnion('authType', [
    zod_1.z.object({ authType: zod_1.z.literal('oauth2') }),
    zod_1.z.object({
        authType: zod_1.z.literal('extendsCredential'),
        extendsCredential: exports.mcpRegistryExtendsCredentialSchema,
    }),
    zod_1.z.object({
        authType: zod_1.z.literal('usesCredentials'),
        usesCredentials: exports.mcpRegistryUsesCredentialsSchema,
    }),
]);
exports.mcpRegistryServerSchema = mcpRegistryServerBaseSchema.and(mcpRegistryServerAuthSchema);
function parseMcpRegistryServer(value) {
    const result = exports.mcpRegistryServerSchema.safeParse(value);
    return result.success ? result.data : null;
}
function toEntity(server) {
    const { slug, status, version, updatedAt, ...rest } = server;
    let mappedStatus = status;
    if (!serverStatuses.includes(status)) {
        mappedStatus = 'deprecated';
    }
    return {
        slug,
        status: mappedStatus,
        version,
        registryUpdatedAt: new Date(updatedAt),
        data: rest,
    };
}
function fromEntity(entity) {
    const { slug, status, version, registryUpdatedAt, data } = entity;
    return {
        slug,
        status,
        version,
        updatedAt: registryUpdatedAt.toISOString(),
        ...data,
    };
}
//# sourceMappingURL=mcp-registry.types.js.map