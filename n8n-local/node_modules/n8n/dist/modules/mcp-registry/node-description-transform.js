"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMcpRegistryCredentialTypeName = exports.getMcpRegistryCredentialOptions = exports.MCP_REGISTRY_PACKAGE_NAME = exports.MCP_REGISTRY_BASE_NODE_NAME = exports.MCP_BASE_OAUTH2_CREDENTIAL_NAME = exports.LANGCHAIN_PACKAGE_NAME = void 0;
exports.serverToCredentialDescription = serverToCredentialDescription;
exports.serverToNodeDescription = serverToNodeDescription;
const change_case_1 = require("change-case");
const mcp_registry_connection_1 = require("./mcp-registry-connection");
const mcp_registry_types_1 = require("./registry/mcp-registry.types");
var mcp_registry_connection_2 = require("./mcp-registry-connection");
Object.defineProperty(exports, "LANGCHAIN_PACKAGE_NAME", { enumerable: true, get: function () { return mcp_registry_connection_2.LANGCHAIN_PACKAGE_NAME; } });
Object.defineProperty(exports, "MCP_BASE_OAUTH2_CREDENTIAL_NAME", { enumerable: true, get: function () { return mcp_registry_connection_2.MCP_BASE_OAUTH2_CREDENTIAL_NAME; } });
Object.defineProperty(exports, "MCP_REGISTRY_BASE_NODE_NAME", { enumerable: true, get: function () { return mcp_registry_connection_2.MCP_REGISTRY_BASE_NODE_NAME; } });
Object.defineProperty(exports, "MCP_REGISTRY_PACKAGE_NAME", { enumerable: true, get: function () { return mcp_registry_connection_2.MCP_REGISTRY_PACKAGE_NAME; } });
var mcp_registry_connection_3 = require("./mcp-registry-connection");
Object.defineProperty(exports, "getMcpRegistryCredentialOptions", { enumerable: true, get: function () { return mcp_registry_connection_3.getMcpRegistryCredentialOptions; } });
Object.defineProperty(exports, "getMcpRegistryCredentialTypeName", { enumerable: true, get: function () { return mcp_registry_connection_3.getMcpRegistryCredentialTypeName; } });
function getMcpRegistryNodeTypeName(server) {
    return (0, change_case_1.camelCase)(server.slug);
}
function getMcpRegistryCredentialHeader(server) {
    return {
        name: (0, mcp_registry_connection_1.getMcpRegistryCredentialTypeName)(server),
        icon: `node:${mcp_registry_connection_1.MCP_REGISTRY_PACKAGE_NAME}.${getMcpRegistryNodeTypeName(server)}`,
        displayName: `${server.title} MCP OAuth2`,
    };
}
function buildDomainRestrictionProperties(hostname) {
    return [
        {
            displayName: 'Allowed HTTP Request Domains',
            name: 'allowedHttpRequestDomains',
            type: 'hidden',
            default: 'domains',
        },
        {
            displayName: 'Allowed Domains',
            name: 'allowedDomains',
            type: 'hidden',
            default: hostname,
        },
    ];
}
function serverToOAuth2CredentialDescription(server) {
    const remote = (0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server);
    if (!remote || remote.isTemplated)
        return null;
    return {
        ...getMcpRegistryCredentialHeader(server),
        extends: [mcp_registry_connection_1.MCP_BASE_OAUTH2_CREDENTIAL_NAME],
        properties: [
            {
                displayName: 'Use Dynamic Client Registration',
                name: 'useDynamicClientRegistration',
                type: 'hidden',
                default: true,
            },
            {
                displayName: 'Server URL',
                name: 'serverUrl',
                type: 'hidden',
                default: (0, mcp_registry_connection_1.getConfiguredEndpointUrl)(remote),
            },
            {
                displayName: 'Resource URL',
                name: 'resourceUrl',
                type: 'hidden',
                default: '',
            },
            ...buildDomainRestrictionProperties(remote.endpointHostname),
        ],
    };
}
function getValidatedExtendsCredential(server, isKnownCredentialType) {
    if (server.authType !== 'extendsCredential')
        return null;
    const parseResult = mcp_registry_types_1.mcpRegistryExtendsCredentialSchema.safeParse(server.extendsCredential);
    if (!parseResult.success)
        return null;
    const { extends: parentType, ...rawOverrides } = parseResult.data;
    if (!isKnownCredentialType(parentType))
        return null;
    const overrides = Object.fromEntries(Object.entries(rawOverrides).filter(([, value]) => value !== null && value !== undefined));
    return { parentType, overrides };
}
function getValidatedUsesCredentials(server, isKnownCredentialType) {
    if (server.authType !== 'usesCredentials')
        return null;
    const parseResult = mcp_registry_types_1.mcpRegistryUsesCredentialsSchema.safeParse(server.usesCredentials);
    if (!parseResult.success)
        return null;
    const supportedCredentials = parseResult.data.filter(({ credentialType }) => isKnownCredentialType(credentialType));
    return supportedCredentials.length > 0 ? supportedCredentials : null;
}
function serverToExtendedCredentialDescription(server, isKnownCredentialType) {
    const validated = getValidatedExtendsCredential(server, isKnownCredentialType);
    if (!validated)
        return null;
    const remote = (0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server);
    if (!remote)
        return null;
    if (validated.overrides.scope !== undefined && validated.overrides.customScopes === undefined) {
        validated.overrides.customScopes = false;
    }
    const overrideProperties = Object.entries(validated.overrides).map(([name, value]) => ({
        displayName: name,
        name,
        type: 'hidden',
        default: value,
    }));
    const serverUrlProperty = {
        displayName: 'Server URL',
        name: 'serverUrl',
        type: 'hidden',
        default: (0, mcp_registry_connection_1.getConfiguredEndpointUrl)(remote),
    };
    const serverUrlOverride = remote.isTemplated ? [serverUrlProperty] : [];
    const allowedDomainsDefault = remote.isTemplated
        ? '={{$self["host"].extractDomain()}}'
        : remote.endpointHostname;
    return {
        ...getMcpRegistryCredentialHeader(server),
        extends: [validated.parentType],
        properties: [
            ...overrideProperties,
            ...serverUrlOverride,
            ...buildDomainRestrictionProperties(allowedDomainsDefault),
        ],
    };
}
function getNodeDescriptionCredentials(server, isKnownCredentialType) {
    switch (server.authType) {
        case 'oauth2':
            return [{ name: (0, mcp_registry_connection_1.getMcpRegistryCredentialTypeName)(server), required: true }];
        case 'extendsCredential': {
            const validated = getValidatedExtendsCredential(server, isKnownCredentialType);
            if (!validated)
                return [];
            return [{ name: (0, mcp_registry_connection_1.getMcpRegistryCredentialTypeName)(server), required: true }];
        }
        case 'usesCredentials': {
            const credentials = getValidatedUsesCredentials(server, isKnownCredentialType);
            if (!credentials)
                return [];
            if (credentials.length === 1) {
                return [{ name: credentials[0].credentialType, required: true }];
            }
            return credentials.map(({ credentialType, value }) => ({
                name: credentialType,
                required: true,
                displayOptions: { show: { authentication: [value] } },
            }));
        }
        default:
            return [];
    }
}
function getAuthenticationProperty(server, isKnownCredentialType) {
    const credentials = getValidatedUsesCredentials(server, isKnownCredentialType);
    if (!credentials || credentials.length < 2)
        return null;
    return {
        displayName: 'Authentication',
        name: 'authentication',
        type: 'options',
        noDataExpression: true,
        options: credentials.map(({ name, value }) => ({ name, value })),
        default: credentials[0].value,
    };
}
const ICON_MIME_PREFERENCE = [
    'image/svg+xml',
    'image/webp',
    'image/png',
    'image/jpeg',
    'image/jpg',
];
function preferredIcon(icons) {
    for (const mimeType of ICON_MIME_PREFERENCE) {
        const match = icons.find((icon) => icon.mimeType === mimeType);
        if (match)
            return match;
    }
    return icons[0];
}
function pickIconUrl(icons) {
    const light = preferredIcon(icons.filter((icon) => icon.theme === 'light'));
    const dark = preferredIcon(icons.filter((icon) => icon.theme === 'dark'));
    if (light && dark)
        return { light: light.src, dark: dark.src };
    return preferredIcon(icons)?.src;
}
function withRemoteDefaults(properties, transport, endpointUrl) {
    return properties.map((property) => {
        if (property.name === 'endpointUrl')
            return { ...property, default: endpointUrl };
        if (property.name === 'serverTransport')
            return { ...property, default: transport };
        return property;
    });
}
function serverToCredentialDescription(server, isKnownCredentialType) {
    switch (server.authType) {
        case 'oauth2':
            return serverToOAuth2CredentialDescription(server);
        case 'extendsCredential':
            return serverToExtendedCredentialDescription(server, isKnownCredentialType);
        case 'usesCredentials':
            return null;
        default:
            return null;
    }
}
function serverToNodeDescription(server, baseDescription, isKnownCredentialType) {
    if (server.authType !== 'oauth2' &&
        server.authType !== 'extendsCredential' &&
        server.authType !== 'usesCredentials') {
        return null;
    }
    const connection = (0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server);
    if (!connection)
        return null;
    const credentials = getNodeDescriptionCredentials(server, isKnownCredentialType);
    if (credentials.length === 0)
        return null;
    const displayName = `${server.title} MCP`;
    const description = structuredClone(baseDescription);
    if (server.status === 'deprecated') {
        description.hidden = true;
    }
    else {
        delete description.hidden;
    }
    description.displayName = displayName;
    description.name = (0, change_case_1.camelCase)(server.slug);
    description.iconUrl = pickIconUrl(server.icons);
    description.description = server.tagline;
    description.defaults = { name: displayName };
    description.credentials = credentials;
    if (description.codex) {
        description.codex.alias?.push(server.title, displayName);
        if (server.websiteUrl) {
            description.codex.resources = { primaryDocumentation: [{ url: server.websiteUrl }] };
        }
    }
    description.properties = withRemoteDefaults(description.properties, connection.transport, (0, mcp_registry_connection_1.getConfiguredEndpointUrl)(connection));
    const authenticationProperty = getAuthenticationProperty(server, isKnownCredentialType);
    if (authenticationProperty) {
        description.properties = [authenticationProperty, ...description.properties];
    }
    description.builderHint = {
        ...description.builderHint,
        searchHint: `Agent-optimised ${server.title} integration. When wiring an ai_tool to an AI Agent for ${server.title}, use THIS node, not the native action node — this variant exposes ${server.title}'s tools in the shape AI Agents expect and ships pre-configured connection details.`,
    };
    return description;
}
//# sourceMappingURL=node-description-transform.js.map