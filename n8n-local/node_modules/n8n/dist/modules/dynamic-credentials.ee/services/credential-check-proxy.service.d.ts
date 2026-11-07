import { GlobalConfig } from '@n8n/config';
import type { CredentialCheckOptions, CredentialCheckResult, DynamicCredentialCheckProxyProvider } from 'n8n-workflow';
import { CredentialTypes } from '../../../credential-types';
import { EnterpriseCredentialsService } from '../../../credentials/credentials.service.ee';
import { NodeTypes } from '../../../node-types';
import { UrlService } from '@n8n/backend-services';
import { ExecutionContextService } from 'n8n-core';
import { AuthorizeIntentService } from './authorize-intent.service';
import { CredentialResolverWorkflowService } from './credential-resolver-workflow.service';
import { DynamicCredentialService } from './dynamic-credential.service';
export declare class CredentialCheckProxyService implements DynamicCredentialCheckProxyProvider {
    private readonly credentialResolverWorkflowService;
    private readonly executionContextService;
    private readonly enterpriseCredentialsService;
    private readonly authorizeIntentService;
    private readonly dynamicCredentialService;
    private readonly urlService;
    private readonly globalConfig;
    private readonly credentialTypes;
    private readonly nodeTypes;
    constructor(credentialResolverWorkflowService: CredentialResolverWorkflowService, executionContextService: ExecutionContextService, enterpriseCredentialsService: EnterpriseCredentialsService, authorizeIntentService: AuthorizeIntentService, dynamicCredentialService: DynamicCredentialService, urlService: UrlService, globalConfig: GlobalConfig, credentialTypes: CredentialTypes, nodeTypes: NodeTypes);
    checkCredentialStatus(workflowId: string, executionContext: {
        credentials?: string;
    }, options?: CredentialCheckOptions): Promise<CredentialCheckResult>;
    private resolveCredentialIconUrl;
    private resolveNodeIconUrl;
    private toAbsoluteIconUrl;
    private generateRevokeUrl;
    private generateAuthorizationUrl;
}
