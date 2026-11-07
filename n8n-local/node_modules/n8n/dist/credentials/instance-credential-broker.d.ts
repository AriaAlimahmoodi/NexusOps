import { Logger } from '@n8n/backend-common';
import { CredentialsEntity, InstanceCredentialAssignmentRepository, type OperationContext } from '@n8n/db';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import { CredentialsService } from './credentials.service';
import { InstanceCredentialUseRegistry, type InstanceCredentialUse } from './instance-credential-use.registry';
export type { InstanceCredentialUse } from './instance-credential-use.registry';
type InstanceCredentialSummary = Pick<CredentialsEntity, 'id' | 'name' | 'type'>;
export interface ResolvedInstanceCredential extends InstanceCredentialSummary {
    data: ICredentialDataDecryptedObject;
}
export declare class InstanceCredentialBroker {
    private readonly logger;
    private readonly useRegistry;
    private readonly assignmentRepository;
    private readonly credentialsService;
    constructor(logger: Logger, useRegistry: InstanceCredentialUseRegistry, assignmentRepository: InstanceCredentialAssignmentRepository, credentialsService: CredentialsService);
    registerUse(credentialUse: InstanceCredentialUse): void;
    listForUse(credentialUse: InstanceCredentialUse): Promise<InstanceCredentialSummary[]>;
    assignForUse(credentialUse: InstanceCredentialUse, credentialId: string, ctx?: OperationContext): Promise<InstanceCredentialSummary>;
    clearForUse(credentialUse: InstanceCredentialUse, ctx?: OperationContext): Promise<void>;
    getAssignedCredentialId(credentialUse: InstanceCredentialUse, ctx?: OperationContext): Promise<string | null>;
    resolveForUse(credentialUse: InstanceCredentialUse, ctx?: OperationContext): Promise<ResolvedInstanceCredential | null>;
    private invalidCredentialError;
}
