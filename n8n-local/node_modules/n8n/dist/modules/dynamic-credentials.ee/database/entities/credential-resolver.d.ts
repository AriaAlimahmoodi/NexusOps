import { WithTimestampsAndStringId } from '@n8n/db';
import type { CredentialResolverConfiguration } from '@n8n/decorators';
export declare class DynamicCredentialResolver extends WithTimestampsAndStringId {
    name: string;
    type: string;
    config: string;
    decryptedConfig?: CredentialResolverConfiguration;
}
