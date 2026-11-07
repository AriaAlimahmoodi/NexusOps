import { type ICredentialDataDecryptedObject } from 'n8n-workflow';
export interface InstanceCredentialUse {
    readonly id: string;
    readonly credentialTypes: readonly string[];
    readonly validate?: (credential: {
        type: string;
        data: ICredentialDataDecryptedObject;
    }) => void;
}
export declare class InstanceCredentialUseRegistry {
    private readonly uses;
    register(credentialUse: InstanceCredentialUse): void;
    get(credentialUseId: string): InstanceCredentialUse;
}
