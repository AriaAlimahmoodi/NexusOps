import type { User } from '@n8n/db';
import z from 'zod';
import type { CommunityNodeTypesService } from '../../../../modules/community-packages/community-node-types.service';
import type { CommunityPackagesLifecycleService } from '../../../../modules/community-packages/community-packages.lifecycle.service';
import type { NodeTypes } from '../../../../node-types';
import type { Telemetry } from '../../../../telemetry';
import type { ToolDefinition } from '../../mcp.types';
declare const inputSchema: {
    nodeType: z.ZodString;
};
export declare const createInstallCommunityNodeTool: (user: User, communityNodeTypesService: CommunityNodeTypesService, communityPackagesLifecycleService: CommunityPackagesLifecycleService, nodeTypes: NodeTypes, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
