import type { ModuleInterface } from '@n8n/decorators';
export declare class DynamicCredentialsModule implements ModuleInterface {
    init(): Promise<void>;
    entities(): Promise<(typeof import("./database/entities/credential-resolver.js").DynamicCredentialResolver | typeof import("./database/entities/dynamic-credential-user-entry.js").DynamicCredentialUserEntry | typeof import("./database/entities/dynamic-credential-entry.js").DynamicCredentialEntry)[]>;
    context(): Promise<{
        credentialCheckProxy: import("./services/credential-check-proxy.service.js").CredentialCheckProxyService;
    }>;
    shutdown(): Promise<void>;
}
