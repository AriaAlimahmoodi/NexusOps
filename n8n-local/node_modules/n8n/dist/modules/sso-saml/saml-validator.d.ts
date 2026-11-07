import { Logger } from '@n8n/backend-common';
import type { IdentityProviderInstance } from 'samlify';
export declare class SamlValidator {
    private readonly logger;
    private xmlMetadata;
    private xmlProtocol;
    private preload;
    constructor(logger: Logger);
    private xmllint;
    private samlify;
    init(): Promise<void>;
    validateIdentityProvider(idp: IdentityProviderInstance): void;
    validateMetadata(metadata: string): Promise<boolean>;
    validateResponse(response: string): Promise<boolean>;
    private loadSchemas;
    private validateXml;
}
