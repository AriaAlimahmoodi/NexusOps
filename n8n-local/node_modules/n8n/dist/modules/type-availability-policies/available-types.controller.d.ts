import type { AvailableTypesResponse } from '@n8n/api-types';
import type { Request, Response } from 'express';
import { NodeTypes } from '../../node-types';
import { TypeAvailabilityPolicyService } from './type-availability-policy.service';
export declare class AvailableTypesController {
    private readonly service;
    private readonly nodeTypes;
    constructor(service: TypeAvailabilityPolicyService, nodeTypes: NodeTypes);
    getAvailableTypes(_req: Request, _res: Response, projectId: string): Promise<AvailableTypesResponse>;
}
