import type { ModuleInterface } from '@n8n/decorators';
import { OAuthJweServiceProxy } from '@n8n/backend-services/auth';
export declare class OAuthJweModule implements ModuleInterface {
    init(): Promise<void>;
    context(): Promise<{
        oauthJweProxyProvider: OAuthJweServiceProxy;
    }>;
}
