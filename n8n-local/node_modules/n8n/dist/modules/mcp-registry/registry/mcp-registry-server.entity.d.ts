import { WithTimestamps } from '@n8n/db';
export type McpRegistryServerData = {
    name: string;
    title: string;
    tagline: string;
    description: string;
    authType: string;
    origin: string;
    isOfficial: boolean;
    icons: Array<{
        src: string;
        mimeType?: string;
        theme?: string;
    }>;
    remotes: Array<{
        type: string;
        url: string;
    }>;
    tools: Array<{
        name: string;
        title?: string;
        annotations?: {
            readOnlyHint?: boolean;
            destructiveHint?: boolean;
            idempotentHint?: boolean;
            openWorldHint?: boolean;
        };
    }>;
    websiteUrl?: string;
    tags?: string[];
    requiredCapabilities?: string[];
    extendsCredential?: {
        extends: string;
        authUrl?: string | null;
        accessTokenUrl?: string | null;
        scope?: string | null;
        authQueryParameters?: string | null;
        grantType?: 'authorizationCode' | 'clientCredentials' | 'pkce' | null;
        authentication?: 'body' | 'header' | null;
        useDynamicClientRegistration?: boolean | null;
        serverUrl?: string | null;
    };
    usesCredentials?: Array<{
        credentialType: string;
        name: string;
        value: string;
    }>;
};
export declare class McpRegistryServerEntity extends WithTimestamps {
    slug: string;
    status: 'active' | 'deprecated';
    version: string;
    registryUpdatedAt: Date;
    data: McpRegistryServerData;
}
