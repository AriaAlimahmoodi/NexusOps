import { Logger } from '@n8n/backend-common';
import { AuthenticatedRequest } from '@n8n/db';
import type { NextFunction, Response } from 'express';
import { Cipher } from 'n8n-core';
import type { ICredentialContext, ICredentialDataDecryptedObject, IExecutionContext, IWorkflowSettings } from 'n8n-workflow';
import { DynamicCredentialsProxy } from '../../../credentials/dynamic-credentials-proxy';
import { LoadNodesAndCredentials } from '../../../load-nodes-and-credentials';
import { DynamicCredentialResolverRegistry } from './credential-resolver-registry.service';
import { ResolverConfigExpressionService } from './resolver-config-expression.service';
import type { CredentialResolutionResult, CredentialResolveMetadata, ICredentialResolutionProvider } from '../../../credentials/credential-resolution-provider.interface';
import { DynamicCredentialResolverRepository } from '../database/repositories/credential-resolver.repository';
import { DynamicCredentialsConfig } from '../dynamic-credentials.config';
export declare class DynamicCredentialService implements ICredentialResolutionProvider {
    private readonly dynamicCredentialConfig;
    private readonly resolverRegistry;
    private readonly resolverRepository;
    private readonly loadNodesAndCredentials;
    private readonly cipher;
    private readonly logger;
    private readonly expressionService;
    private readonly dynamicCredentialsProxy;
    constructor(dynamicCredentialConfig: DynamicCredentialsConfig, resolverRegistry: DynamicCredentialResolverRegistry, resolverRepository: DynamicCredentialResolverRepository, loadNodesAndCredentials: LoadNodesAndCredentials, cipher: Cipher, logger: Logger, expressionService: ResolverConfigExpressionService, dynamicCredentialsProxy: DynamicCredentialsProxy);
    resolveIfNeeded(credentialsResolveMetadata: CredentialResolveMetadata, staticData: ICredentialDataDecryptedObject, executionContext?: IExecutionContext, workflowSettings?: IWorkflowSettings, executionId?: string): Promise<CredentialResolutionResult>;
    getSystemResolverId(): string;
    resolveOwningUserIdForAuthorization(credentialContext: ICredentialContext, resolverId: string): Promise<{
        status: 'unbound';
    } | {
        status: 'bound';
        userId: string;
    } | {
        status: 'unresolved';
    }>;
    private buildCredentialContext;
    private handleResolutionError;
    private handleResolverNotConfigured;
    private handleResolverNotFound;
    private handleMissingContext;
    getDynamicCredentialsEndpointsMiddleware(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
}
