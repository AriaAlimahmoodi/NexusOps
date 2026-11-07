import type { InstanceAiMcpConnectionResponse, InstanceAiMcpConnectionToolsResponse } from '@n8n/api-types';
import { InstanceAiMcpCreateConnectionRequestDto, InstanceAiMcpUpdateConnectionRequestDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { CredentialsFinderService } from '@n8n/backend-services';
import { McpRegistryService } from '../../../modules/mcp-registry/registry/mcp-registry.service';
import { InstanceAiMcpRegistryService } from './instance-ai-mcp-registry.service';
export declare class InstanceAiMcpConnectionController {
    private readonly service;
    private readonly credentialsFinderService;
    private readonly mcpRegistryService;
    constructor(service: InstanceAiMcpRegistryService, credentialsFinderService: CredentialsFinderService, mcpRegistryService: McpRegistryService);
    list(req: AuthenticatedRequest): Promise<InstanceAiMcpConnectionResponse[]>;
    create(req: AuthenticatedRequest, _res: Response, payload: InstanceAiMcpCreateConnectionRequestDto): Promise<InstanceAiMcpConnectionResponse>;
    listAllTools(req: AuthenticatedRequest): Promise<InstanceAiMcpConnectionToolsResponse[]>;
    listTools(req: AuthenticatedRequest, _res: Response, id: string): Promise<InstanceAiMcpConnectionToolsResponse>;
    update(req: AuthenticatedRequest, _res: Response, id: string, payload: InstanceAiMcpUpdateConnectionRequestDto): Promise<InstanceAiMcpConnectionResponse>;
    delete(req: AuthenticatedRequest, _res: Response, id: string): Promise<void>;
}
