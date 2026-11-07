import type { AvailableCredentialTypesResponse } from '@n8n/api-types';
import type { Request, Response } from 'express';
import { CredentialTypes } from '../../credential-types';
import { TypeAvailabilityPolicyService } from './type-availability-policy.service';
export declare class AvailableCredentialTypesController {
    private readonly service;
    private readonly credentialTypes;
    constructor(service: TypeAvailabilityPolicyService, credentialTypes: CredentialTypes);
    getAvailableCredentialTypes(_req: Request, _res: Response, projectId: string): Promise<AvailableCredentialTypesResponse>;
}
