import { CredentialsRepository, User, WorkflowRepository } from '@n8n/db';
import { Cipher } from 'n8n-core';
import { ICredentialContext, INode } from 'n8n-workflow';
import { DynamicCredentialsProxy } from '../../../credentials/dynamic-credentials-proxy';
import { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import { DynamicCredentialResolverRegistry } from './credential-resolver-registry.service';
import { DynamicCredentialResolverRepository } from '../database/repositories/credential-resolver.repository';
type CredentialStatus = {
    credentialId: string;
    credentialName: string;
    resolverId?: string;
    credentialType: string;
    status: 'missing' | 'configured' | 'resolver_missing';
};
export declare class CredentialResolverWorkflowService {
    private readonly workflowRepository;
    private readonly credentialRepository;
    private readonly resolverRegistry;
    private readonly resolverRepository;
    private readonly cipher;
    private readonly dynamicCredentialsProxy;
    private readonly workflowFinderService;
    constructor(workflowRepository: WorkflowRepository, credentialRepository: CredentialsRepository, resolverRegistry: DynamicCredentialResolverRegistry, resolverRepository: DynamicCredentialResolverRepository, cipher: Cipher, dynamicCredentialsProxy: DynamicCredentialsProxy, workflowFinderService: WorkflowFinderService);
    private getResolver;
    getWorkflowStatus(workflowId: string, credentialContext: ICredentialContext, options?: {
        user?: User;
        rootNodes?: INode[];
    }): Promise<CredentialStatus[]>;
    private collectResolvableCredentials;
    private extractSubWorkflowIds;
    private extractWorkflowId;
    private getCachedResolver;
    private checkCredentialStatus;
}
export {};
