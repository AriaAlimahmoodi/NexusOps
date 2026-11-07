import { McpDiscoveryVisitRequestDto } from './mcp-discovery.dto';
import { AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { McpDiscoveryEnrollmentService } from './enrollment.service';
export declare class McpDiscoveryController {
    private readonly enrollment;
    constructor(enrollment: McpDiscoveryEnrollmentService);
    visit(req: AuthenticatedRequest, _: Response, payload: McpDiscoveryVisitRequestDto): Promise<import("./types").McpDiscoveryState>;
}
