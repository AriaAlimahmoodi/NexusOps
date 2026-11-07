import { CreateRoleMappingRuleDto, MoveRoleMappingRuleDto, RoleMappingRuleListPublicDto, RoleMappingRuleListQueryPublicDto, RoleMappingRulePublicDto, UpdateRoleMappingRulePublicDto } from '@n8n/api-types';
import { LicenseState } from '@n8n/backend-common';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { RoleMappingRuleService } from '../../../modules/provisioning.ee/role-mapping-rule.service.ee';
export declare class RoleMappingRulesPublicController {
    private readonly roleMappingRuleService;
    private readonly licenseState;
    constructor(roleMappingRuleService: RoleMappingRuleService, licenseState: LicenseState);
    getRoleMappingRules(_req: AuthenticatedRequest, _res: Response, query: RoleMappingRuleListQueryPublicDto): Promise<RoleMappingRuleListPublicDto>;
    createRoleMappingRule(req: AuthenticatedRequest, _res: Response, body: CreateRoleMappingRuleDto): Promise<RoleMappingRulePublicDto>;
    moveRoleMappingRule(req: AuthenticatedRequest, _res: Response, roleMappingRuleId: string, body: MoveRoleMappingRuleDto): Promise<RoleMappingRulePublicDto>;
    updateRoleMappingRule(req: AuthenticatedRequest, _res: Response, roleMappingRuleId: string, body: UpdateRoleMappingRulePublicDto): Promise<RoleMappingRulePublicDto>;
    deleteRoleMappingRule(req: AuthenticatedRequest, _res: Response, roleMappingRuleId: string): Promise<RoleMappingRulePublicDto>;
    private assertProvisioningLicensed;
}
