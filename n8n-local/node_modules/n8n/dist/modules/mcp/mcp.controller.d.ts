import { Logger } from '@n8n/backend-common';
import { AuthenticatedRequest } from '@n8n/db';
import type { Request, Response } from 'express';
import { ErrorReporter } from 'n8n-core';
import { Telemetry } from '../../telemetry';
import { McpProtectedResource } from './mcp-protected-resource';
import { McpService } from './mcp.service';
export type FlushableResponse = Response & {
    flush: () => void;
};
export declare class McpController {
    private readonly errorReporter;
    private readonly mcpService;
    private readonly telemetry;
    private readonly logger;
    private readonly mcpProtectedResource;
    constructor(errorReporter: ErrorReporter, mcpService: McpService, telemetry: Telemetry, logger: Logger, mcpProtectedResource: McpProtectedResource);
    private setCorsHeaders;
    discoverAuthSchemeHead(_req: Request, res: Response): Promise<void>;
    handleGet(_req: AuthenticatedRequest, res: Response): Promise<void>;
    build(req: AuthenticatedRequest, res: FlushableResponse): Promise<void>;
    private handleTransportRequest;
    private trackConnectionEvent;
}
