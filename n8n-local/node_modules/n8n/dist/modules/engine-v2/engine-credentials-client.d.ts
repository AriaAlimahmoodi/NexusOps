import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import { EngineControlPlaneTransport } from './engine-control-plane-transport';
import type { ResolveCredentialRequest } from './engine-credentials.contract';
export declare class EngineCredentialsClient {
    private readonly http;
    constructor(transport: EngineControlPlaneTransport);
    resolve(request: ResolveCredentialRequest, signal: AbortSignal): Promise<ICredentialDataDecryptedObject>;
}
