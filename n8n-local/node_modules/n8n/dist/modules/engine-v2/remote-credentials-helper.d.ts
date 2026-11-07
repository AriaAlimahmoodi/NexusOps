import type { AdditionalDataContext } from '@n8n/node-engine-compatibility';
import type { ICredentialDataDecryptedObject, ICredentials, ICredentialsExpressionResolveValues, ICredentialTypes, IExecuteData, IHttpRequestHelper, IHttpRequestOptions, INode, INodeCredentialsDetails, INodeProperties, IRequestOptionsSimplified, IWorkflowExecuteAdditionalData, Workflow, WorkflowExecuteMode } from 'n8n-workflow';
import { ICredentialsHelper } from 'n8n-workflow';
import type { EngineCredentialsClient } from './engine-credentials-client';
export declare class RemoteCredentialsHelper extends ICredentialsHelper {
    private readonly client;
    private readonly delegate;
    private readonly credentialTypes;
    private readonly context;
    private readonly signal;
    constructor(client: EngineCredentialsClient, delegate: ICredentialsHelper, credentialTypes: ICredentialTypes, context: AdditionalDataContext, signal: AbortSignal);
    getDecrypted(_additionalData: IWorkflowExecuteAdditionalData, nodeCredentials: INodeCredentialsDetails, type: string, _mode: WorkflowExecuteMode, executeData?: IExecuteData, raw?: boolean, expressionResolveValues?: ICredentialsExpressionResolveValues): Promise<ICredentialDataDecryptedObject>;
    preAuthentication(helpers: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject, typeName: string, node: INode, credentialsExpired: boolean): Promise<ICredentialDataDecryptedObject | undefined>;
    private hasExpirableProperty;
    updateCredentialsOauthTokenData(_nodeCredentials: INodeCredentialsDetails, type: string, _data: ICredentialDataDecryptedObject, _additionalData: IWorkflowExecuteAdditionalData): Promise<void>;
    private oauthRefreshUnsupported;
    getCredentials(_nodeCredentials: INodeCredentialsDetails, type: string): Promise<ICredentials>;
    updateCredentials(_nodeCredentials: INodeCredentialsDetails, type: string, _data: ICredentialDataDecryptedObject): Promise<void>;
    authenticate(credentials: ICredentialDataDecryptedObject, typeName: string, requestOptions: IHttpRequestOptions | IRequestOptionsSimplified, workflow?: Workflow, node?: INode): Promise<IHttpRequestOptions>;
    runPreAuthentication(helpers: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject, typeName: string): Promise<ICredentialDataDecryptedObject | undefined>;
    getParentTypes(name: string): string[];
    isCredentialUsableByNode(credentialType: string, nodeType: string): boolean;
    getCredentialsProperties(type: string): INodeProperties[];
}
