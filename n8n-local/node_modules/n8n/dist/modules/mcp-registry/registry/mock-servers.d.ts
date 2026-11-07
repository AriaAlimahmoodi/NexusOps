import type { McpRegistryServer } from './mcp-registry.types';
export declare const notionMockServer: {
    name: string;
    slug: string;
    title: string;
    description: string;
    tagline: string;
    version: string;
    updatedAt: string;
    icons: {
        src: string;
        mimeType: "image/svg+xml";
    }[];
    websiteUrl: string;
    authType: "oauth2";
    remotes: ({
        type: "streamable-http";
        url: string;
    } | {
        type: "sse";
        url: string;
    })[];
    tools: ({
        name: string;
        title: string;
        annotations: {
            readOnlyHint: true;
        };
    } | {
        name: string;
        title: string;
        annotations: {
            readOnlyHint: false;
        };
    })[];
    isOfficial: true;
    origin: "registry";
    status: "active";
    tags: string[];
};
export declare const slackExtendingMockServer: {
    name: string;
    slug: string;
    title: string;
    description: string;
    tagline: string;
    version: string;
    updatedAt: string;
    icons: {
        src: string;
        mimeType: "image/svg+xml";
    }[];
    websiteUrl: string;
    authType: "extendsCredential";
    remotes: {
        type: "streamable-http";
        url: string;
    }[];
    tools: never[];
    isOfficial: true;
    origin: "registry";
    status: "active";
    extendsCredential: {
        extends: string;
        authUrl: string;
        accessTokenUrl: string;
        scope: string;
        authQueryParameters: string;
    };
};
export declare const gmailDirectExtendMockServer: {
    name: string;
    slug: string;
    title: string;
    description: string;
    tagline: string;
    version: string;
    updatedAt: string;
    icons: {
        src: string;
        mimeType: "image/svg+xml";
    }[];
    websiteUrl: string;
    authType: "extendsCredential";
    remotes: {
        type: "streamable-http";
        url: string;
    }[];
    tools: never[];
    isOfficial: true;
    origin: "registry";
    status: "active";
    extendsCredential: {
        extends: string;
    };
};
export declare const githubUsesCredentialsMockServer: {
    name: string;
    slug: string;
    title: string;
    description: string;
    tagline: string;
    version: string;
    updatedAt: string;
    icons: {
        src: string;
        mimeType: "image/svg+xml";
    }[];
    websiteUrl: string;
    authType: "usesCredentials";
    usesCredentials: {
        credentialType: string;
        name: string;
        value: string;
    }[];
    remotes: {
        type: "streamable-http";
        url: string;
    }[];
    tools: never[];
    isOfficial: true;
    origin: "registry";
    status: "active";
};
export declare const databricksGenieTemplatedMockServer: McpRegistryServer;
export declare const linearMockServer: McpRegistryServer;
