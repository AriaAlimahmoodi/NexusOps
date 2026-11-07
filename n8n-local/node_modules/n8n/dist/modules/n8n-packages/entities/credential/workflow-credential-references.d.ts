import { type INode, type INodeCredentialsDetails } from 'n8n-workflow';
type CredentialVisitor = (credentialType: string, details: INodeCredentialsDetails) => boolean;
export declare function visitWorkflowCredentials(nodes: INode[] | undefined, visitor: CredentialVisitor): boolean;
export {};
