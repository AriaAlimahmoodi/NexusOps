import type { ICredentialType, INodeTypeDescription } from 'n8n-workflow';
import { type McpRegistryServer } from './registry/mcp-registry.types';
export { LANGCHAIN_PACKAGE_NAME, MCP_BASE_OAUTH2_CREDENTIAL_NAME, MCP_REGISTRY_BASE_NODE_NAME, MCP_REGISTRY_PACKAGE_NAME, } from './mcp-registry-connection';
export { getMcpRegistryCredentialOptions, getMcpRegistryCredentialTypeName, } from './mcp-registry-connection';
export type IsKnownCredentialType = (name: string) => boolean;
export declare function serverToCredentialDescription(server: McpRegistryServer, isKnownCredentialType: IsKnownCredentialType): ICredentialType | null;
export declare function serverToNodeDescription(server: McpRegistryServer, baseDescription: INodeTypeDescription, isKnownCredentialType: IsKnownCredentialType): INodeTypeDescription | null;
