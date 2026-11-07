import type { UpdateCredentialPublicDto } from '@n8n/api-types';
import type { CredentialsEntity } from '@n8n/db';
import { type INodeProperties } from 'n8n-workflow';
import type { CredentialsHelper } from '../../../../credentials-helper';
import type { IJsonSchema } from '../../../types';
export type CredentialListSharedItem = {
    id: string;
    name: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare function buildSharedForCredential(credential: CredentialsEntity): CredentialListSharedItem[];
export declare function validateCredentialData(credentialsHelper: CredentialsHelper, credentialType: string, data: Record<string, unknown>, options?: {
    partialData?: boolean;
}): void;
export declare function assertValidUpdateProperties(credentialsHelper: CredentialsHelper, existingCredential: CredentialsEntity, body: UpdateCredentialPublicDto): void;
export declare function toJsonSchema(properties: INodeProperties[]): IJsonSchema;
