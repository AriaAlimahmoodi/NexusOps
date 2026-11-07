import type { McpRegistryServerResponse } from '@n8n/api-types';
import type { McpRegistryServer } from './registry/mcp-registry.types';
export declare function toMcpRegistryServerResponse(server: McpRegistryServer): McpRegistryServerResponse | null;
