import { PutProjectPolicyDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { TypeAvailabilityPolicyService } from './type-availability-policy.service';
export declare class TypeAvailabilityPolicyProjectController {
    private readonly service;
    constructor(service: TypeAvailabilityPolicyService);
    getProjectPolicy(req: AuthenticatedRequest<{
        projectId: string;
    }>): Promise<{
        scopeId: string | null;
        rules: readonly import("@n8n/api-types").PolicyRule[];
        defaultAction: import("@n8n/api-types").PolicyAction;
        version: number;
    }>;
    putProjectPolicy(req: AuthenticatedRequest<{
        projectId: string;
    }>, _res: Response, dto: PutProjectPolicyDto): Promise<{
        scopeId: string;
        rules: import("@n8n/api-types").PolicyRule[];
        defaultAction: import("@n8n/api-types").PolicyAction;
        version: number;
        warnings: readonly import("./policy-rule-lint").PolicyRuleWarning[];
    }>;
}
