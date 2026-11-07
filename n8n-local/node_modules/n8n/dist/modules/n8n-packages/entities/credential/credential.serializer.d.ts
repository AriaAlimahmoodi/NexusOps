import type { CredentialsEntity } from '@n8n/db';
import { type SerializedCredential, type SerializedCredentialData } from '../../spec/serialized/credential.schema';
export declare class CredentialSerializer {
    serialize(credential: CredentialsEntity, { data, dataIsComplete }?: {
        data?: SerializedCredentialData;
        dataIsComplete?: boolean;
    }): SerializedCredential;
}
