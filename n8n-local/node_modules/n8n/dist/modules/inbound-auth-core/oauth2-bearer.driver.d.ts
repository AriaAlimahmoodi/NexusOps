import { AuthenticationDriver, LocalAuthorizationServer, TrustedSourceStore, type AdvertisedResource, type Extracted, type Result, type TrustedSource, type Verified } from '@n8n/inbound-auth';
import { Logger } from '@n8n/backend-common';
export declare class Oauth2BearerDriver extends AuthenticationDriver {
    private readonly store;
    private readonly localServer;
    readonly credentialKind: 'bearer';
    readonly sourceTypes: Array<TrustedSource['type']>;
    private readonly logger;
    constructor(store: TrustedSourceStore, localServer: LocalAuthorizationServer, logger: Logger);
    selectSource(extracted: Extracted): Promise<TrustedSource | undefined>;
    private reject;
    verify(extracted: Extracted, source: TrustedSource): Promise<Result<Verified>>;
    advertise(resource: AdvertisedResource, sources: TrustedSource[]): {
        authorizationServers?: string[];
        challenge?: string;
    };
}
