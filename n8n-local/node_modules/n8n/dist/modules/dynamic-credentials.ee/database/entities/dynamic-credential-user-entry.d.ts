import { CredentialsEntity, User, WithTimestamps } from '@n8n/db';
import { DynamicCredentialResolver } from './credential-resolver';
export declare class DynamicCredentialUserEntry extends WithTimestamps {
    constructor();
    credentialId: string;
    userId: string;
    resolverId: string;
    data: string;
    credential: CredentialsEntity;
    user: User;
    resolver: DynamicCredentialResolver;
}
