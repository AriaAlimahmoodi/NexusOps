import { WithTimestamps } from '@n8n/db';
import type { McpToolPermissions } from '@n8n/api-types';
export declare class InstanceAiMcpRegistryConnection extends WithTimestamps {
    id: string;
    userId: string;
    serverSlug: string;
    credentialId: string;
    toolPermissions: McpToolPermissions;
}
