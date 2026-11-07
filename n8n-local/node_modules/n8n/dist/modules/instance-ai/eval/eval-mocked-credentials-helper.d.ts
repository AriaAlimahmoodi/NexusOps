import type { InstanceAiEvalMockedCredential, InstanceAiEvalRewrittenCredential } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import type { ICredentialDataDecryptedObject, ICredentials, ICredentialsExpressionResolveValues, IExecuteData, IGetDecryptedCredentialsOptions, IHttpRequestHelper, IHttpRequestOptions, INode, INodeCredentialsDetails, INodeProperties, IRequestOptionsSimplified, IWorkflowExecuteAdditionalData, Workflow, WorkflowExecuteMode } from 'n8n-workflow';
import { ICredentialsHelper } from 'n8n-workflow';
export declare const EVAL_PROVIDER_URL_FIELD: Record<string, {
    field: string;
    pathPrefix: string;
}>;
export declare class EvalMockedCredentialsHelper extends ICredentialsHelper {
    private readonly inner;
    private readonly serverUrl;
    private readonly logger;
    private readonly subNodeToRoot?;
    readonly mockedCredentials: InstanceAiEvalMockedCredential[];
    readonly rewrittenCredentials: InstanceAiEvalRewrittenCredential[];
    readonly interceptionGaps: string[];
    constructor(inner: ICredentialsHelper, serverUrl: string | undefined, logger: Logger, subNodeToRoot?: ReadonlyMap<string, string> | undefined);
    getParentTypes(name: string): string[];
    authenticate(credentials: ICredentialDataDecryptedObject, typeName: string, requestOptions: IHttpRequestOptions | IRequestOptionsSimplified, workflow: Workflow, node: INode): Promise<IHttpRequestOptions>;
    preAuthentication(helpers: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject, typeName: string, node: INode, credentialsExpired: boolean): Promise<ICredentialDataDecryptedObject | undefined>;
    runPreAuthentication(helpers: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject, typeName: string): Promise<ICredentialDataDecryptedObject | undefined>;
    getCredentials(nodeCredentials: INodeCredentialsDetails, type: string): Promise<ICredentials>;
    getDecrypted(additionalData: IWorkflowExecuteAdditionalData, nodeCredentials: INodeCredentialsDetails, type: string, mode: WorkflowExecuteMode, executeData?: IExecuteData, raw?: boolean, expressionResolveValues?: ICredentialsExpressionResolveValues, options?: IGetDecryptedCredentialsOptions): Promise<ICredentialDataDecryptedObject>;
    private recordInterceptionGap;
    private applyServerUrlRewrite;
    updateCredentials(nodeCredentials: INodeCredentialsDetails, type: string, data: ICredentialDataDecryptedObject): Promise<void>;
    updateCredentialsOauthTokenData(nodeCredentials: INodeCredentialsDetails, type: string, data: ICredentialDataDecryptedObject, additionalData: IWorkflowExecuteAdditionalData): Promise<void>;
    getCredentialsProperties(type: string): INodeProperties[];
    isCredentialUsableByNode(credentialType: string, nodeType: string): boolean;
}
