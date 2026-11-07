import { CredentialsEntity, WithTimestamps } from '@n8n/db';
import { DynamicCredentialResolver } from './credential-resolver';
export declare class DynamicCredentialEntry extends WithTimestamps {
    constructor();
    credentialId: string;
    subjectId: string;
    resolverId: string;
    data: string;
    credential: CredentialsEntity;
    resolver: DynamicCredentialResolver;
}
