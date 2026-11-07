import { OptionsRequestDto, ResourceLocatorRequestDto, ResourceMapperFieldsRequestDto, ActionResultRequestDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { ExecutionContextService } from 'n8n-core';
import type { INodePropertyOptions, NodeParameterValueType } from 'n8n-workflow';
import { AuthService } from '../auth/auth.service';
import { DynamicNodeParametersService } from '../services/dynamic-node-parameters.service';
export declare class DynamicNodeParametersController {
    private readonly dynamicNodeParametersService;
    private readonly authService;
    private readonly executionContextService;
    constructor(dynamicNodeParametersService: DynamicNodeParametersService, authService: AuthService, executionContextService: ExecutionContextService);
    private buildExecutionContext;
    getOptions(req: AuthenticatedRequest, _res: Response, payload: OptionsRequestDto): Promise<INodePropertyOptions[]>;
    getResourceLocatorResults(req: AuthenticatedRequest, _res: Response, payload: ResourceLocatorRequestDto): Promise<import("n8n-workflow").INodeListSearchResult>;
    getResourceMappingFields(req: AuthenticatedRequest, _res: Response, payload: ResourceMapperFieldsRequestDto): Promise<import("n8n-workflow").ResourceMapperFields>;
    getLocalResourceMappingFields(req: AuthenticatedRequest, _res: Response, payload: ResourceMapperFieldsRequestDto): Promise<import("n8n-workflow").ResourceMapperFields>;
    getActionResult(req: AuthenticatedRequest, _res: Response, payload: ActionResultRequestDto): Promise<NodeParameterValueType>;
}
