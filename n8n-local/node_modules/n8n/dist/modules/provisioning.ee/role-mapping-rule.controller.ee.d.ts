import { CreateRoleMappingRuleDto, ListRoleMappingRuleQueryDto, MoveRoleMappingRuleDto, PatchRoleMappingRuleDto } from '@n8n/api-types';
import { LicenseState } from '@n8n/backend-common';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import type { RoleMappingRuleListResponse, RoleMappingRuleResponse } from './role-mapping-rule.service.ee';
import { RoleMappingRuleService } from './role-mapping-rule.service.ee';
export declare class RoleMappingRuleController {
    private readonly roleMappingRuleService;
    private readonly licenseState;
    constructor(roleMappingRuleService: RoleMappingRuleService, licenseState: LicenseState);
    list(_req: AuthenticatedRequest, res: Response, query: ListRoleMappingRuleQueryDto): Promise<RoleMappingRuleListResponse | Response>;
    create(req: AuthenticatedRequest, res: Response, body: CreateRoleMappingRuleDto): Promise<RoleMappingRuleResponse | Response>;
    move(req: AuthenticatedRequest, res: Response, body: MoveRoleMappingRuleDto, id: string): Promise<RoleMappingRuleResponse | Response>;
    patch(req: AuthenticatedRequest, res: Response, body: PatchRoleMappingRuleDto, id: string): Promise<RoleMappingRuleResponse | Response>;
    delete(req: AuthenticatedRequest, res: Response, id: string): Promise<{
        success: true;
    } | Response>;
}
