import { Logger } from '@n8n/backend-common';
import { CredentialResolverEntryMetadata, ICredentialResolver } from '@n8n/decorators';
export declare class DynamicCredentialResolverRegistry {
    private readonly credentialResolverEntryMetadata;
    private readonly logger;
    private resolverMap;
    constructor(credentialResolverEntryMetadata: CredentialResolverEntryMetadata, logger: Logger);
    init(): Promise<void>;
    getResolverByTypename(name: string): ICredentialResolver | undefined;
    getAllResolvers(): ICredentialResolver[];
}
