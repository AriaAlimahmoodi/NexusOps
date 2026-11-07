import { AuthenticationDriver, AuthenticationService, TrustedSourceStore, type AdvertisedResource, type Extracted, type Result, type Verified } from '@n8n/inbound-auth';
import { Oauth2BearerDriver } from './oauth2-bearer.driver';
export declare class OAuth2AuthenticationService extends AuthenticationService {
    private readonly store;
    private readonly drivers;
    constructor(store: TrustedSourceStore, bearer: Oauth2BearerDriver, drivers?: AuthenticationDriver[]);
    authenticate(extracted: Extracted): Promise<Result<Verified>>;
    advertise(resource: AdvertisedResource): Promise<{
        authorizationServers: string[];
        challenges: string[];
    }>;
}
