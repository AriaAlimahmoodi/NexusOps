"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleMappingRulesPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const role_mapping_rule_service_ee_1 = require("../../../modules/provisioning.ee/role-mapping-rule.service.ee");
const pagination_service_1 = require("../../../public-api/v1/shared/services/pagination.service");
function toRoleMappingRulePublicDto(rule) {
    return {
        id: rule.id,
        expression: rule.expression,
        role: rule.role,
        type: rule.type,
        order: rule.order,
        projectIds: rule.projectIds,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
    };
}
let RoleMappingRulesPublicController = class RoleMappingRulesPublicController {
    constructor(roleMappingRuleService, licenseState) {
        this.roleMappingRuleService = roleMappingRuleService;
        this.licenseState = licenseState;
    }
    async getRoleMappingRules(_req, _res, query) {
        this.assertProvisioningLicensed();
        const { offset, limit } = (0, pagination_service_1.resolveOffsetPagination)(query);
        const { count, items } = await this.roleMappingRuleService.list({
            skip: offset,
            take: limit,
            type: query.type,
        });
        return {
            data: items.map(toRoleMappingRulePublicDto),
            nextCursor: (0, pagination_service_1.encodeNextCursor)({
                offset,
                limit,
                numberOfTotalRecords: count,
            }),
        };
    }
    async createRoleMappingRule(req, _res, body) {
        this.assertProvisioningLicensed();
        const rule = await this.roleMappingRuleService.create(body, req.user);
        return toRoleMappingRulePublicDto(rule);
    }
    async moveRoleMappingRule(req, _res, roleMappingRuleId, body) {
        this.assertProvisioningLicensed();
        const rule = await this.roleMappingRuleService.move({
            id: roleMappingRuleId,
            targetIndex: body.targetIndex,
            userId: req.user.id,
            userEmail: req.user.email,
        });
        return toRoleMappingRulePublicDto(rule);
    }
    async updateRoleMappingRule(req, _res, roleMappingRuleId, body) {
        this.assertProvisioningLicensed();
        const rule = await this.roleMappingRuleService.patch({
            id: roleMappingRuleId,
            dto: body,
            userId: req.user.id,
            userEmail: req.user.email,
        });
        return toRoleMappingRulePublicDto(rule);
    }
    async deleteRoleMappingRule(req, _res, roleMappingRuleId) {
        this.assertProvisioningLicensed();
        const rule = await this.roleMappingRuleService.delete({
            id: roleMappingRuleId,
            userId: req.user.id,
            userEmail: req.user.email,
        });
        return toRoleMappingRulePublicDto(rule);
    }
    assertProvisioningLicensed() {
        if (!this.licenseState.isProvisioningLicensed()) {
            throw new errors_1.ForbiddenError('Provisioning is not licensed');
        }
    }
};
exports.RoleMappingRulesPublicController = RoleMappingRulesPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('roleMappingRule:list'),
    (0, decorators_1.ApiSummary)('Retrieve role-mapping rules'),
    (0, decorators_1.ApiDescription)("Returns the configured role-mapping rules. `order` is the rule's evaluation position within its own `type`, so instance and project rules each have their own sequence starting at 0 — filter by `type` to retrieve a single evaluation order."),
    (0, decorators_1.ApiTags)(['RoleMappingRule']),
    (0, decorators_1.ApiResponse)(200, api_types_1.RoleMappingRuleListPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.RoleMappingRuleListQueryPublicDto]),
    __metadata("design:returntype", Promise)
], RoleMappingRulesPublicController.prototype, "getRoleMappingRules", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ApiKeyScope)('roleMappingRule:create'),
    (0, decorators_1.ApiSummary)('Create a role-mapping rule'),
    (0, decorators_1.ApiDescription)('Creates a rule that maps an identity-provider claim expression to a role. Set `type` to `instance` for a rule granting a global role, or `project` for a rule granting a project role on the projects named in `projectIds`. Omitting `order` appends the rule to the end of the evaluation order for its type.'),
    (0, decorators_1.ApiTags)(['RoleMappingRule']),
    (0, decorators_1.ApiResponse)(201, api_types_1.RoleMappingRulePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateRoleMappingRuleDto]),
    __metadata("design:returntype", Promise)
], RoleMappingRulesPublicController.prototype, "createRoleMappingRule", null);
__decorate([
    (0, decorators_1.Post)('/:roleMappingRuleId/move'),
    (0, decorators_1.ApiKeyScope)('roleMappingRule:update'),
    (0, decorators_1.ApiSummary)('Move a role-mapping rule'),
    (0, decorators_1.ApiDescription)("Changes a rule's position in the evaluation order for its type. `targetIndex` is the desired 0-based position within the rule's own `type` sequence; a value beyond the last position moves the rule to the end."),
    (0, decorators_1.ApiTags)(['RoleMappingRule']),
    (0, decorators_1.ApiResponse)(200, api_types_1.RoleMappingRulePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('roleMappingRuleId', api_types_1.roleMappingRuleIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.MoveRoleMappingRuleDto]),
    __metadata("design:returntype", Promise)
], RoleMappingRulesPublicController.prototype, "moveRoleMappingRule", null);
__decorate([
    (0, decorators_1.Patch)('/:roleMappingRuleId'),
    (0, decorators_1.ApiKeyScope)('roleMappingRule:update'),
    (0, decorators_1.ApiSummary)('Update a role-mapping rule'),
    (0, decorators_1.ApiDescription)("Updates a rule's claim expression, role, and/or project assignments. A rule's type cannot be changed once created, so `type` isn't accepted here, and reordering is handled by the move endpoint."),
    (0, decorators_1.ApiTags)(['RoleMappingRule']),
    (0, decorators_1.ApiResponse)(200, api_types_1.RoleMappingRulePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('roleMappingRuleId', api_types_1.roleMappingRuleIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateRoleMappingRulePublicDto]),
    __metadata("design:returntype", Promise)
], RoleMappingRulesPublicController.prototype, "updateRoleMappingRule", null);
__decorate([
    (0, decorators_1.Delete)('/:roleMappingRuleId'),
    (0, decorators_1.ApiKeyScope)('roleMappingRule:delete'),
    (0, decorators_1.ApiSummary)('Delete a role-mapping rule'),
    (0, decorators_1.ApiDescription)('Deletes a role-mapping rule. The remaining rules of the same type close the gap, so their `order` values stay a contiguous sequence starting at 0.'),
    (0, decorators_1.ApiTags)(['RoleMappingRule']),
    (0, decorators_1.ApiResponse)(200, api_types_1.RoleMappingRulePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('roleMappingRuleId', api_types_1.roleMappingRuleIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], RoleMappingRulesPublicController.prototype, "deleteRoleMappingRule", null);
exports.RoleMappingRulesPublicController = RoleMappingRulesPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/role-mapping-rules'),
    __metadata("design:paramtypes", [role_mapping_rule_service_ee_1.RoleMappingRuleService, backend_common_1.LicenseState])
], RoleMappingRulesPublicController);
//# sourceMappingURL=role-mapping-rules.public.controller.js.map