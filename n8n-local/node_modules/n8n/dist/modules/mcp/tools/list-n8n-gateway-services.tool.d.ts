import type { User } from '@n8n/db';
import type { AiGatewayService } from '../../../services/ai-gateway.service';
import type { Telemetry } from '../../../telemetry';
import type { ToolDefinition } from '../mcp.types';
declare const inputSchema: {};
export declare const createListN8nGatewayServicesTool: (user: User, aiGatewayService: AiGatewayService, telemetry: Telemetry) => ToolDefinition<typeof inputSchema>;
export {};
