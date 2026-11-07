import { Logger } from '@n8n/backend-common';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import { CredentialsHelper } from '../../credentials-helper';
import { CredentialsPermissionChecker } from '../../executions/pre-execution-checks';
import type { ResolveCredentialRequest } from './engine-credentials.contract';
export declare class EngineCredentialsService {
    private readonly permissionChecker;
    private readonly credentialsHelper;
    private readonly logger;
    constructor(permissionChecker: CredentialsPermissionChecker, credentialsHelper: CredentialsHelper, logger: Logger);
    resolve({ credential, execution, context, consumer, }: ResolveCredentialRequest): Promise<ICredentialDataDecryptedObject>;
}
