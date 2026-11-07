import { LocalAuthorizationServer, type AuthorizationServerMetadata, type Jwk } from '@n8n/inbound-auth';
type Listener = () => Promise<void>;
export declare class LocalAuthorizationServerProxy extends LocalAuthorizationServer {
    private provider;
    private readonly listeners;
    registerProvider(provider: LocalAuthorizationServer): Promise<void>;
    onProviderRegistered(listener: Listener): Promise<void>;
    getMetadata(): Promise<AuthorizationServerMetadata>;
    getJwks(): Promise<{
        keys: Jwk[];
    }>;
    isAccessTokenActive(token: string): Promise<boolean>;
    private required;
}
export {};
