import { CreateCredentialTypePolicyDocumentDto, PutCredentialTypeInstancePolicyDto, ReplaceAttachmentsDto, UpdateCredentialTypePolicyDocumentDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { TypeAvailabilityPolicyService } from './type-availability-policy.service';
export declare class CredentialTypePolicyInstanceController {
    private readonly service;
    constructor(service: TypeAvailabilityPolicyService);
    getInstancePolicy(): Promise<{
        scopeId: string | null;
        rules: readonly import("@n8n/api-types").PolicyRule[];
        defaultAction: import("@n8n/api-types").PolicyAction;
        version: number;
    }>;
    putInstancePolicy(req: AuthenticatedRequest, _res: Response, dto: PutCredentialTypeInstancePolicyDto): Promise<{
        scopeId: string;
        rules: import("@n8n/api-types").PolicyRule[];
        defaultAction: import("@n8n/api-types").PolicyAction;
        version: number;
        warnings: readonly import("./policy-rule-lint").PolicyRuleWarning[];
    }>;
    createPolicy(req: AuthenticatedRequest, _res: Response, dto: CreateCredentialTypePolicyDocumentDto): Promise<{
        policy: import("./database/entities/type-availability-policy.entity").TypeAvailabilityPolicy;
        warnings: readonly import("./policy-rule-lint").PolicyRuleWarning[];
    }>;
    listPolicies(): Promise<import("./database/entities/type-availability-policy.entity").TypeAvailabilityPolicy[]>;
    getPolicy(_req: AuthenticatedRequest, _res: Response, policyId: string): Promise<import("./database/entities/type-availability-policy.entity").TypeAvailabilityPolicy>;
    updatePolicy(req: AuthenticatedRequest, _res: Response, policyId: string, dto: UpdateCredentialTypePolicyDocumentDto): Promise<{
        policy: import("./database/entities/type-availability-policy.entity").TypeAvailabilityPolicy;
        warnings: readonly import("./policy-rule-lint").PolicyRuleWarning[];
    }>;
    deletePolicy(req: AuthenticatedRequest, _res: Response, policyId: string): Promise<{
        success: boolean;
    }>;
    getAttachments(_req: AuthenticatedRequest, _res: Response, scopeId: string): Promise<import("./type-availability-policy.service").ScopeAttachments>;
    replaceAttachments(req: AuthenticatedRequest, _res: Response, scopeId: string, dto: ReplaceAttachmentsDto): Promise<import("./type-availability-policy.service").ScopeAttachments>;
}
